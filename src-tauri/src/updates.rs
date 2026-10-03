//! Manual lesson-content updates (docs/CONTENT_UPDATES.md).
//!
//! The feed URL and the minisign public key are fixed at build time
//! (CANOPY_CONTENT_FEED, CANOPY_CONTENT_PUBKEY). Nothing here runs unless the
//! learner presses "Check for updates".

use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};

use anyhow::{bail, Context, Result};
use canopy_core::catalog::{Catalog, FORMAT_VERSION};
use canopy_core::env::AppPaths;
use canopy_core::validate::{validate, Level};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::content::{newer, updates_dir};

pub const FEED: Option<&str> = option_env!("CANOPY_CONTENT_FEED");
pub const PUBKEY: Option<&str> = option_env!("CANOPY_CONTENT_PUBKEY");
const MAX_BYTES: u64 = 64 * 1024 * 1024;

/// latest.json published next to each lesson pack.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Feed {
    pub content_version: String,
    pub format_version: u32,
    /// URL of the .tar.gz pack; its signature is at `<url>.minisig`.
    pub url: String,
    pub sha256: String,
    pub size: u64,
    #[serde(default)]
    pub changelog: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckResult {
    pub configured: bool,
    pub installed: String,
    /// Newer pack this app can install.
    pub available: Option<Feed>,
    /// Newer pack that needs a newer app (lesson format).
    pub needs_newer_app: Option<Feed>,
}

fn client() -> Result<reqwest::blocking::Client> {
    Ok(reqwest::blocking::Client::builder()
        .user_agent(concat!("Canopy/", env!("CARGO_PKG_VERSION")))
        .timeout(std::time::Duration::from_secs(60))
        .build()?)
}

pub fn check(installed: &str) -> Result<CheckResult> {
    let Some(feed_url) = FEED.filter(|f| !f.is_empty()) else {
        return Ok(CheckResult { configured: false, installed: installed.into(), available: None, needs_newer_app: None });
    };
    let feed: Feed = client()?
        .get(feed_url)
        .send()
        .context("Could not reach the update server")?
        .error_for_status()?
        .json()
        .context("The update server sent something unexpected")?;
    let mut result = CheckResult { configured: true, installed: installed.into(), available: None, needs_newer_app: None };
    if newer(&feed.content_version, installed) {
        if feed.format_version == FORMAT_VERSION {
            result.available = Some(feed);
        } else if feed.format_version > FORMAT_VERSION {
            result.needs_newer_app = Some(feed);
        }
    }
    Ok(result)
}

/// Download, verify and install a pack. `progress(done, total)` is called while downloading.
pub fn install(paths: &AppPaths, feed: &Feed, mut progress: impl FnMut(u64, u64)) -> Result<()> {
    if feed.size > MAX_BYTES {
        bail!("The lesson pack is unexpectedly large");
    }
    let client = client()?;
    let mut resp = client.get(&feed.url).send().context("Could not reach the update server")?.error_for_status()?;
    let mut bytes = Vec::with_capacity(feed.size as usize);
    let mut buf = [0u8; 64 * 1024];
    loop {
        let n = resp.read(&mut buf).context("Download was interrupted")?;
        if n == 0 {
            break;
        }
        bytes.extend_from_slice(&buf[..n]);
        if bytes.len() as u64 > MAX_BYTES {
            bail!("The lesson pack is unexpectedly large");
        }
        progress(bytes.len() as u64, feed.size);
    }
    let signature = client
        .get(format!("{}.minisig", feed.url))
        .send()
        .and_then(|r| r.error_for_status())
        .and_then(|r| r.text())
        .context("Could not download the pack signature")?;
    verify(&bytes, &feed.sha256, &signature)?;
    unpack_and_swap(paths, &bytes, &feed.content_version)
}

/// Checksum and minisign signature. Lesson setup scripts run on the learner's
/// machine, so an unverifiable pack is never installed.
pub fn verify(bytes: &[u8], sha256_hex: &str, signature: &str) -> Result<()> {
    let digest = Sha256::digest(bytes);
    let hex: String = digest.iter().map(|b| format!("{b:02x}")).collect();
    if !hex.eq_ignore_ascii_case(sha256_hex.trim()) {
        bail!("The file did not match its checksum");
    }
    let key = PUBKEY.filter(|k| !k.is_empty()).context("This build has no update signing key")?;
    let pk = minisign_verify::PublicKey::from_base64(key).context("bad signing key in this build")?;
    let sig = minisign_verify::Signature::decode(signature).context("The pack signature is malformed")?;
    pk.verify(bytes, &sig, false).context("The pack signature is not valid")?;
    Ok(())
}

pub fn unpack_and_swap(paths: &AppPaths, tar_gz: &[u8], expect_version: &str) -> Result<()> {
    let content = paths.data.join("content");
    let staging = content.join("staging");
    if staging.exists() {
        fs::remove_dir_all(&staging)?;
    }
    fs::create_dir_all(&staging)?;
    let mut archive = tar::Archive::new(flate2::read::GzDecoder::new(tar_gz));
    for entry in archive.entries()? {
        let mut entry = entry?;
        let kind = entry.header().entry_type();
        if !(kind.is_file() || kind.is_dir()) {
            bail!("The lesson pack contains an unsupported entry");
        }
        // unpack_in refuses paths that escape the target folder.
        if !entry.unpack_in(&staging)? {
            bail!("The lesson pack contains an unsafe path");
        }
    }
    let root = pack_root(&staging)?;
    let catalog = Catalog::load(&root).context("The lesson pack could not be read")?;
    if catalog.manifest.content_version != expect_version {
        bail!("The lesson pack version does not match the update feed");
    }
    let errors: Vec<String> = validate(&catalog)
        .into_iter()
        .filter(|i| i.level == Level::Error)
        .map(|i| i.to_string())
        .collect();
    if !errors.is_empty() {
        bail!("The lesson pack failed validation:\n{}", errors.join("\n"));
    }
    let current = updates_dir(paths);
    let previous = content.join("previous");
    if previous.exists() {
        fs::remove_dir_all(&previous)?;
    }
    if current.exists() {
        fs::rename(&current, &previous)?;
    }
    fs::rename(&root, &current)?;
    if root != staging {
        let _ = fs::remove_dir_all(&staging);
    }
    Ok(())
}

/// The pack may contain the lessons at its root or inside one folder.
fn pack_root(staging: &Path) -> Result<PathBuf> {
    if staging.join("manifest.yaml").exists() {
        return Ok(staging.to_path_buf());
    }
    let dirs: Vec<PathBuf> = fs::read_dir(staging)?.flatten().map(|e| e.path()).filter(|p| p.is_dir()).collect();
    match dirs.as_slice() {
        [one] if one.join("manifest.yaml").exists() => Ok(one.clone()),
        _ => bail!("The lesson pack has no manifest.yaml"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn pack(dir: &Path) -> Vec<u8> {
        let mut out = Vec::new();
        {
            let enc = flate2::write::GzEncoder::new(&mut out, flate2::Compression::fast());
            let mut b = tar::Builder::new(enc);
            b.append_dir_all("lessons", dir).unwrap();
            b.into_inner().unwrap().finish().unwrap();
        }
        out
    }

    #[test]
    fn unpack_validates_and_swaps() {
        let tmp = std::env::temp_dir().join(format!("canopy-upd-{}", std::process::id()));
        let src = tmp.join("src");
        fs::create_dir_all(&src).unwrap();
        fs::write(src.join("manifest.yaml"), "formatVersion: 1\ncontentVersion: \"2030.01.01.1\"\n").unwrap();
        fs::write(src.join("sections.yaml"), "[]\n").unwrap();
        let paths = AppPaths::new(tmp.join("data"));
        unpack_and_swap(&paths, &pack(&src), "2030.01.01.1").unwrap();
        assert!(updates_dir(&paths).join("manifest.yaml").exists());
        // Wrong version is refused and the installed copy stays.
        assert!(unpack_and_swap(&paths, &pack(&src), "2030.01.01.2").is_err());
        assert!(updates_dir(&paths).join("manifest.yaml").exists());
        fs::remove_dir_all(&tmp).ok();
    }

    #[test]
    fn checksum_mismatch_is_refused() {
        let err = verify(b"abc", "00", "").unwrap_err();
        assert!(err.to_string().contains("checksum"));
    }
}
