//! Bridge for GIT_EDITOR / GIT_SEQUENCE_EDITOR. The `canopy-editor` script
//! drops `<id>.req` files holding a path; we show that file in the in-app
//! editor and answer with `<id>.done` or `<id>.cancel`.

use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;

use anyhow::{bail, Result};
use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EditorRequest {
    pub id: String,
    pub path: String,
    pub content: String,
    /// "rebase-todo", "commit-message", "merge-message", "tag-message" or "other".
    pub kind: String,
}

pub fn spawn_watcher(app: AppHandle, dir: PathBuf) {
    std::thread::spawn(move || {
        let mut seen: HashSet<String> = HashSet::new();
        loop {
            if let Ok(entries) = fs::read_dir(&dir) {
                let mut live = HashSet::new();
                for e in entries.flatten() {
                    let name = e.file_name().to_string_lossy().into_owned();
                    let Some(id) = name.strip_suffix(".req") else { continue };
                    live.insert(id.to_string());
                    if seen.contains(id) {
                        continue;
                    }
                    if let Ok(path) = fs::read_to_string(e.path()) {
                        let path = path.trim().to_string();
                        let content = fs::read_to_string(&path).unwrap_or_default();
                        let kind = classify(Path::new(&path)).to_string();
                        let _ = app.emit("editor-request", EditorRequest { id: id.to_string(), path, content, kind });
                        seen.insert(id.to_string());
                    }
                }
                seen.retain(|id| live.contains(id));
            }
            std::thread::sleep(Duration::from_millis(120));
        }
    });
}

fn classify(path: &Path) -> &'static str {
    match path.file_name().and_then(|n| n.to_str()).unwrap_or("") {
        "git-rebase-todo" => "rebase-todo",
        "COMMIT_EDITMSG" => "commit-message",
        "MERGE_MSG" => "merge-message",
        "TAG_EDITMSG" => "tag-message",
        _ => "other",
    }
}

/// Finish a request: save `content` (if given) and let git continue, or cancel.
pub fn finish(dir: &Path, workspace: &Path, id: &str, content: Option<&str>) -> Result<()> {
    if id.contains('/') || id.contains("..") {
        bail!("bad editor request id");
    }
    let req = dir.join(format!("{id}.req"));
    let path = PathBuf::from(fs::read_to_string(&req)?.trim());
    match content {
        Some(text) => {
            let canon = fs::canonicalize(&path)?;
            if !canon.starts_with(fs::canonicalize(workspace)?) {
                bail!("editor file is outside the Canopy workspace");
            }
            fs::write(&canon, text)?;
            fs::write(dir.join(format!("{id}.done")), "")?;
        }
        None => fs::write(dir.join(format!("{id}.cancel")), "")?,
    }
    Ok(())
}
