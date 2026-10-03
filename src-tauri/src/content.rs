//! Where lesson content comes from: a downloaded content update, a dev
//! override, or the copy bundled with the app.

use std::path::PathBuf;

use anyhow::{Context, Result};
use canopy_core::catalog::Catalog;
use canopy_core::env::AppPaths;
use tauri::{AppHandle, Manager};

/// Installed content updates live here (see docs/CONTENT_UPDATES.md).
pub fn updates_dir(paths: &AppPaths) -> PathBuf {
    paths.data.join("content").join("current")
}

fn bundled_dir(app: &AppHandle) -> Result<PathBuf> {
    if let Ok(dir) = std::env::var("CANOPY_LESSONS") {
        return Ok(PathBuf::from(dir));
    }
    if cfg!(debug_assertions) {
        return Ok(PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../lessons"));
    }
    Ok(app.path().resource_dir()?.join("lessons"))
}

/// Use the newest content we can read: an installed update wins over the
/// bundled copy only if it is a newer contentVersion with a supported format.
pub fn load_catalog(app: &AppHandle, paths: &AppPaths) -> Result<Catalog> {
    let bundled = Catalog::load(&bundled_dir(app)?).context("loading bundled lessons")?;
    let update_dir = updates_dir(paths);
    if update_dir.join("manifest.yaml").exists() {
        match Catalog::load(&update_dir) {
            Ok(update) if newer(&update.manifest.content_version, &bundled.manifest.content_version) => return Ok(update),
            Ok(_) => {}
            Err(e) => eprintln!("ignoring installed content update: {e:#}"),
        }
    }
    Ok(bundled)
}

/// Compare dotted numeric versions like "2026.10.03.2".
pub fn newer(a: &str, b: &str) -> bool {
    let parse = |v: &str| v.split('.').map(|p| p.parse::<u64>().unwrap_or(0)).collect::<Vec<_>>();
    parse(a) > parse(b)
}

#[cfg(test)]
mod tests {
    #[test]
    fn version_order() {
        assert!(super::newer("2026.10.03.10", "2026.10.03.9"));
        assert!(!super::newer("2026.10.03.1", "2026.10.03.1"));
    }
}
