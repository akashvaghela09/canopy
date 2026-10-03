//! Running the system git CLI.

use std::path::{Path, PathBuf};
use std::process::{Command, Output, Stdio};

use anyhow::{bail, Context, Result};

use crate::env::EnvVars;

#[derive(Debug, Clone)]
pub struct Git {
    pub dir: PathBuf,
    pub env: EnvVars,
}

impl Git {
    pub fn new(dir: impl Into<PathBuf>, env: EnvVars) -> Self {
        Git { dir: dir.into(), env }
    }

    pub fn command(&self, args: &[&str]) -> Command {
        let mut cmd = Command::new("git");
        cmd.arg("--no-optional-locks")
            .args(args)
            .current_dir(&self.dir)
            .env_clear()
            .envs(self.env.iter().map(|(k, v)| (k, v)))
            .stdin(Stdio::null());
        cmd
    }

    pub fn output(&self, args: &[&str]) -> Result<Output> {
        self.command(args)
            .output()
            .with_context(|| format!("running git {}", args.join(" ")))
    }

    /// stdout of a successful command; error otherwise.
    pub fn run(&self, args: &[&str]) -> Result<String> {
        let out = self.output(args)?;
        if !out.status.success() {
            bail!(
                "git {} failed: {}",
                args.join(" "),
                String::from_utf8_lossy(&out.stderr).trim()
            );
        }
        Ok(String::from_utf8_lossy(&out.stdout).into_owned())
    }

    /// stdout if the command succeeded, None if it exited non-zero.
    pub fn try_run(&self, args: &[&str]) -> Result<Option<String>> {
        let out = self.output(args)?;
        Ok(out
            .status
            .success()
            .then(|| String::from_utf8_lossy(&out.stdout).into_owned()))
    }

    pub fn ok(&self, args: &[&str]) -> Result<bool> {
        Ok(self.output(args)?.status.success())
    }

    /// Resolve a revision to a full commit id.
    pub fn resolve_commit(&self, rev: &str) -> Result<Option<String>> {
        let spec = format!("{rev}^{{commit}}");
        Ok(self
            .try_run(&["rev-parse", "--verify", "--quiet", "--end-of-options", &spec])?
            .map(|s| s.trim().to_string()))
    }

    /// Path inside the git dir, e.g. git_path("MERGE_HEAD").
    pub fn git_path(&self, name: &str) -> Result<PathBuf> {
        let p = self.run(&["rev-parse", "--git-path", name])?;
        let p = PathBuf::from(p.trim());
        Ok(if p.is_absolute() { p } else { self.dir.join(p) })
    }
}

/// Parse `git --version` output, e.g. "git version 2.43.0" -> (2, 43, 0).
pub fn parse_version(s: &str) -> Option<(u32, u32, u32)> {
    let v = s.split_whitespace().find(|w| w.chars().next().is_some_and(|c| c.is_ascii_digit()))?;
    let mut parts = v.split('.').map(|p| {
        p.chars()
            .take_while(|c| c.is_ascii_digit())
            .collect::<String>()
            .parse::<u32>()
            .ok()
    });
    Some((parts.next()??, parts.next().flatten().unwrap_or(0), parts.next().flatten().unwrap_or(0)))
}

pub fn system_git_version() -> Option<(u32, u32, u32)> {
    let out = Command::new("git").arg("--version").output().ok()?;
    parse_version(&String::from_utf8_lossy(&out.stdout))
}

/// True if `path` is the top level of a work tree (or, for bare repos, the git dir).
pub fn is_repo_root(path: &Path, env: &EnvVars) -> Result<Option<bool>> {
    if !path.is_dir() {
        return Ok(None);
    }
    let git = Git::new(path, env.clone());
    let Some(bare) = git.try_run(&["rev-parse", "--is-bare-repository"])? else {
        return Ok(None);
    };
    let canon = |p: &Path| std::fs::canonicalize(p).ok();
    if bare.trim() == "true" {
        let dir = git.run(&["rev-parse", "--absolute-git-dir"])?;
        return Ok((canon(Path::new(dir.trim())) == canon(path)).then_some(true));
    }
    let top = git.run(&["rev-parse", "--show-toplevel"])?;
    Ok((canon(Path::new(top.trim())) == canon(path)).then_some(false))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn versions() {
        assert_eq!(parse_version("git version 2.43.0"), Some((2, 43, 0)));
        assert_eq!(parse_version("git version 2.39.3 (Apple Git-146)"), Some((2, 39, 3)));
        assert_eq!(parse_version("git version 2.45.1.windows.1"), Some((2, 45, 1)));
    }
}
