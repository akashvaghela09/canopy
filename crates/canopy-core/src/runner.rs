//! Preparing lesson attempts: running setup.sh, actions, and reading marks.

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

use anyhow::{bail, Context, Result};

use crate::catalog::Lesson;
use crate::env::{learner_env, setup_env, AppPaths, EditorMode};
use crate::git::Git;

pub const DEFAULT_NAME: &str = "Canopy Learner";
pub const DEFAULT_EMAIL: &str = "learner@example.com";

/// A prepared lesson folder.
#[derive(Debug, Clone)]
pub struct Attempt {
    pub lesson_id: String,
    pub root: PathBuf,
    pub state: PathBuf,
    /// Terminal start directory.
    pub start: PathBuf,
}

/// Delete any previous attempt and run setup.sh. Returns setup's combined
/// output on failure.
pub fn prepare(paths: &AppPaths, lib: &Path, lesson: &Lesson) -> Result<Attempt> {
    paths.ensure()?;
    let id = &lesson.meta.id;
    let root = paths.lesson_root(id);
    let state = paths.lesson_state(id);
    for dir in [&root, &state] {
        if dir.exists() {
            fs::remove_dir_all(dir).with_context(|| format!("removing {}", dir.display()))?;
        }
        fs::create_dir_all(dir)?;
    }

    run_script(paths, lib, lesson, &lesson.dir.join("setup.sh"), &root)
        .with_context(|| format!("setup for lesson {id}"))?;

    write_lesson_config(paths, lesson)?;

    let start = root.join(&lesson.meta.start);
    if !start.is_dir() {
        bail!("lesson {id}: start folder {:?} was not created by setup", lesson.meta.start);
    }
    Ok(Attempt { lesson_id: id.clone(), root, state, start })
}

/// Run one of the lesson's actions (e.g. a teammate pushing).
pub fn run_action(paths: &AppPaths, lib: &Path, lesson: &Lesson, action_id: &str) -> Result<String> {
    let action = lesson
        .meta
        .actions
        .iter()
        .find(|a| a.id == action_id)
        .with_context(|| format!("lesson {} has no action {action_id}", lesson.meta.id))?;
    let root = paths.lesson_root(&lesson.meta.id);
    run_script(paths, lib, lesson, &lesson.dir.join(&action.script), &root)
}

fn run_script(paths: &AppPaths, lib: &Path, lesson: &Lesson, script: &Path, cwd: &Path) -> Result<String> {
    let env = setup_env(paths, lib, &lesson.dir, &lesson.meta.id);
    let out = Command::new("bash")
        .arg(script)
        .current_dir(cwd)
        .env_clear()
        .envs(env)
        .stdin(Stdio::null())
        .output()
        .with_context(|| format!("running {}", script.display()))?;
    let text = format!(
        "{}{}",
        String::from_utf8_lossy(&out.stdout),
        String::from_utf8_lossy(&out.stderr)
    );
    if !out.status.success() {
        bail!("{} exited with {}:\n{}", script.display(), out.status, text.trim());
    }
    Ok(text)
}

/// Write the attempt's global and system config files.
///
/// - global: Canopy's defaults and, unless the lesson teaches identity
///   (`identity: false`), the learner's saved name and email. Values are
///   copied in rather than included, so the learner can use `include.path`
///   freely (13.06).
/// - system: a fallback identity, so commits work even if the learner never
///   set one. Global and local values override it.
pub fn write_lesson_config(paths: &AppPaths, lesson: &Lesson) -> Result<()> {
    let id = &lesson.meta.id;
    fs::create_dir_all(paths.lesson_state(id))?;
    let mut global = fs::read_to_string(paths.base_config()).unwrap_or_default();
    if lesson.meta.identity {
        let git = Git::new(&paths.data, learner_env(paths, id, EditorMode::NoOp));
        let profile = paths.profile_config().to_string_lossy().into_owned();
        let get = |key: &str| -> Result<Option<String>> {
            Ok(git.try_run(&["config", "--file", &profile, "--get", key])?.map(|v| v.trim_end_matches('\n').to_string()))
        };
        if let (Some(name), Some(email)) = (get("user.name")?, get("user.email")?) {
            global.push_str(&format!("[user]\n\tname = {}\n\temail = {}\n", quote(&name), quote(&email)));
        }
    }
    fs::write(paths.global_config(id), global)?;
    fs::write(
        paths.system_config(id),
        format!("# Canopy's fallback identity.\n[user]\n\tname = {DEFAULT_NAME}\n\temail = {DEFAULT_EMAIL}\n"),
    )?;
    Ok(())
}

/// Quote a config value.
fn quote(v: &str) -> String {
    format!("\"{}\"", v.replace('\\', "\\\\").replace('"', "\\\""))
}

/// Remember the identity the learner set at the global level in this
/// attempt, so later lessons use it too.
pub fn sync_profile(paths: &AppPaths, lesson_id: &str) -> Result<()> {
    let cfg = paths.global_config(lesson_id);
    if !cfg.exists() {
        return Ok(());
    }
    let git = Git::new(&paths.data, learner_env(paths, lesson_id, EditorMode::NoOp));
    let file = cfg.to_string_lossy().into_owned();
    let profile = paths.profile_config().to_string_lossy().into_owned();
    for key in ["user.name", "user.email"] {
        let Some(v) = git.try_run(&["config", "--file", &file, "--no-includes", "--get", key])? else { continue };
        let v = v.trim_end_matches('\n');
        let current = git.try_run(&["config", "--file", &profile, "--get", key])?;
        if current.as_deref().map(|c| c.trim_end_matches('\n')) != Some(v) {
            git.run(&["config", "--file", &profile, key, v])?;
        }
    }
    Ok(())
}

/// Marks recorded by setup via `mark <name>`: name -> commit id.
pub fn read_marks(state: &Path) -> Result<HashMap<String, String>> {
    let path = state.join("marks.tsv");
    let mut marks = HashMap::new();
    if !path.exists() {
        return Ok(marks);
    }
    for line in fs::read_to_string(path)?.lines() {
        let mut parts = line.split('\t');
        if let (Some(name), Some(_repo), Some(sha)) = (parts.next(), parts.next(), parts.next()) {
            marks.insert(name.to_string(), sha.to_string());
        }
    }
    Ok(marks)
}
