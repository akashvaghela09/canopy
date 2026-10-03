//! Tauri commands called by the frontend.

use std::collections::HashMap;
use std::fmt::Display;
use std::fs;
use std::path::PathBuf;
use std::process::Command;

use canopy_core::catalog::{Lesson, LessonMeta, Manifest, Section};
use canopy_core::check::{check_answer, CheckContext};
use canopy_core::env::{learner_env, EditorMode};
use canopy_core::git::{parse_version, system_git_version};
use canopy_core::runner::{prepare, read_marks, run_action as core_run_action};
use canopy_core::validate::recommended_before;
use serde::Serialize;
use serde_json::Value;
use tauri::ipc::Channel;
use tauri::{AppHandle, State};

use crate::session::Session;
use crate::{editor, AppState};

/// Minimum git to run Canopy at all (GIT_CONFIG_GLOBAL / GIT_CONFIG_SYSTEM).
pub const MIN_GIT: (u32, u32, u32) = (2, 32, 0);

type CmdResult<T> = Result<T, String>;

fn err(e: impl Display) -> String {
    format!("{e:#}")
}

fn anyhow_err(e: anyhow::Error) -> String {
    format!("{e:#}")
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitCheck {
    found: bool,
    version: Option<String>,
    minimum: String,
    ok: bool,
}

#[tauri::command]
pub fn git_check() -> GitCheck {
    let v = system_git_version();
    GitCheck {
        found: v.is_some(),
        version: v.map(|(a, b, c)| format!("{a}.{b}.{c}")),
        minimum: format!("{}.{}.{}", MIN_GIT.0, MIN_GIT.1, MIN_GIT.2),
        ok: v.is_some_and(|v| v >= MIN_GIT),
    }
}

/// Which outside tools exist (gpg, ssh-keygen, git-subtree).
#[tauri::command]
pub fn tool_check(tools: Vec<String>) -> HashMap<String, bool> {
    tools
        .into_iter()
        .map(|t| {
            let found = match t.as_str() {
                "git-subtree" => Command::new("git")
                    .args(["subtree", "-h"])
                    .output()
                    .map(|o| !String::from_utf8_lossy(&o.stderr).contains("not a git command"))
                    .unwrap_or(false),
                other => Command::new("sh")
                    .args(["-c", &format!("command -v {other}")])
                    .output()
                    .map(|o| o.status.success())
                    .unwrap_or(false),
            };
            (t, found)
        })
        .collect()
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LessonSummary {
    #[serde(flatten)]
    meta: LessonMeta,
    /// Lessons that teach this lesson's required skills.
    recommended: Vec<String>,
    /// Git too old for this lesson.
    needs_newer_git: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogView {
    manifest: Manifest,
    sections: Vec<Section>,
    lessons: Vec<LessonSummary>,
    /// lesson id -> completed at (unix ms)
    completed: HashMap<String, i64>,
    /// Completed by skipping (tool missing, git too old, optional).
    skipped: Vec<String>,
}

#[tauri::command]
pub fn get_catalog(state: State<AppState>) -> CmdResult<CatalogView> {
    let catalog = state.catalog.read().unwrap().clone();
    let git = system_git_version();
    let lessons = catalog
        .lessons
        .iter()
        .filter(|l| !l.meta.has_flag("retired"))
        .map(|l| LessonSummary {
            recommended: recommended_before(&catalog, l),
            needs_newer_git: match (&l.meta.min_git, git) {
                (Some(min), Some(have)) => parse_version(min).is_some_and(|m| have < m),
                _ => false,
            },
            meta: l.meta.clone(),
        })
        .collect();
    // One lock for both reads: a second `lock()` in the same expression
    // would deadlock (the first guard lives until the end of the statement).
    let (completed, skipped) = {
        let db = state.db.lock().unwrap();
        (db.completed().map_err(anyhow_err)?, db.skipped().map_err(anyhow_err)?)
    };
    Ok(CatalogView {
        manifest: catalog.manifest.clone(),
        sections: catalog.sections.clone(),
        lessons,
        completed,
        skipped,
    })
}

/// Skip a lesson: it counts as complete with a "skipped" mark (DESIGN.md 7.5).
#[tauri::command]
pub fn skip_lesson(state: State<AppState>, id: String) -> CmdResult<()> {
    lesson_by_id(&state, &id)?;
    state.db.lock().unwrap().mark_skipped(&id, crate::session::now_ms()).map_err(anyhow_err)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActionView {
    id: String,
    label: String,
    script: String,
    source: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedAnswer {
    value: Value,
    correct: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LessonView {
    meta: LessonMeta,
    content: String,
    questions: Vec<Value>,
    goals: Vec<String>,
    answers: HashMap<String, SavedAnswer>,
    actions: Vec<ActionView>,
    recommended: Vec<String>,
    /// An attempt folder already exists (the lesson can resume).
    has_attempt: bool,
}

fn lesson_by_id(state: &AppState, id: &str) -> CmdResult<Lesson> {
    let catalog = state.catalog.read().unwrap();
    catalog.lesson(id).cloned().ok_or_else(|| format!("no lesson {id}"))
}

#[tauri::command]
pub fn get_lesson(state: State<AppState>, id: String) -> CmdResult<LessonView> {
    let lesson = lesson_by_id(&state, &id)?;
    let goal = lesson.goal().map_err(anyhow_err)?;
    let catalog = state.catalog.read().unwrap().clone();
    let answers = state
        .db
        .lock()
        .unwrap()
        .answers(&id)
        .map_err(anyhow_err)?
        .into_iter()
        .map(|(k, (value, correct))| (k, SavedAnswer { value, correct }))
        .collect();
    Ok(LessonView {
        content: lesson.content().map_err(anyhow_err)?,
        questions: goal.questions.iter().map(|q| q.public()).collect(),
        goals: goal.goals.iter().map(|g| g.label.clone()).collect(),
        answers,
        actions: lesson
            .meta
            .actions
            .iter()
            .map(|a| ActionView {
                id: a.id.clone(),
                label: a.label.clone(),
                script: a.script.clone(),
                source: fs::read_to_string(lesson.dir.join(&a.script)).unwrap_or_default(),
            })
            .collect(),
        recommended: recommended_before(&catalog, &lesson),
        has_attempt: state.paths.lesson_root(&id).exists(),
        meta: lesson.meta,
    })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StartInfo {
    lesson_id: String,
    root: String,
    fresh: bool,
}

/// Start (or resume) a lesson: prepare the folder if needed and open the shell.
#[tauri::command]
pub async fn start_lesson(
    app: AppHandle,
    state: State<'_, AppState>,
    id: String,
    reset: bool,
    cols: u16,
    rows: u16,
    output: Channel<String>,
) -> CmdResult<StartInfo> {
    // Stop the previous shell first so it releases the folder.
    *state.session.lock().unwrap() = None;

    let lesson = lesson_by_id(&state, &id)?;
    let catalog = state.catalog.read().unwrap().clone();
    let paths = state.paths.clone();
    let root = paths.lesson_root(&id);
    let fresh = reset || !root.exists();
    let attempt = if fresh {
        state.db.lock().unwrap().clear_attempt(&id).map_err(anyhow_err)?;
        let lib = catalog.lib_dir();
        let l = lesson.clone();
        let p = paths.clone();
        tauri::async_runtime::spawn_blocking(move || prepare(&p, &lib, &l))
            .await
            .map_err(err)?
            .map_err(anyhow_err)?
    } else {
        canopy_core::runner::Attempt {
            lesson_id: id.clone(),
            start: root.join(&lesson.meta.start),
            state: paths.lesson_state(&id),
            root: root.clone(),
        }
    };
    if !paths.global_config(&id).exists() {
        canopy_core::runner::write_lesson_config(&paths, &lesson).map_err(anyhow_err)?;
    }
    let marks = read_marks(&attempt.state).map_err(anyhow_err)?;
    let start_dir = if attempt.start.is_dir() { attempt.start.clone() } else { attempt.root.clone() };
    let session = Session::start(app, &paths, lesson, &start_dir, marks, state.db.clone(), output, (cols, rows), fresh)
        .map_err(anyhow_err)?;
    *state.session.lock().unwrap() = Some(session);
    Ok(StartInfo { lesson_id: id, root: attempt.root.to_string_lossy().into_owned(), fresh })
}

#[tauri::command]
pub fn stop_lesson(state: State<AppState>) {
    *state.session.lock().unwrap() = None;
}

fn with_session<T>(state: &AppState, f: impl FnOnce(&Session) -> CmdResult<T>) -> CmdResult<T> {
    let guard = state.session.lock().unwrap();
    let s = guard.as_ref().ok_or("no lesson is running")?;
    f(s)
}

#[tauri::command]
pub fn terminal_write(state: State<AppState>, data: String) -> CmdResult<()> {
    with_session(&state, |s| s.write(data.as_bytes()).map_err(anyhow_err))
}

#[tauri::command]
pub fn terminal_resize(state: State<AppState>, cols: u16, rows: u16) -> CmdResult<()> {
    with_session(&state, |s| s.resize(cols, rows).map_err(anyhow_err))
}

#[tauri::command]
pub fn submit_answer(state: State<AppState>, question: String, value: Value) -> CmdResult<bool> {
    let lesson_id = with_session(&state, |s| Ok(s.lesson_id.clone()))?;
    let lesson = lesson_by_id(&state, &lesson_id)?;
    let goal = lesson.goal().map_err(anyhow_err)?;
    let q = goal.questions.iter().find(|q| q.id == question).ok_or("no such question")?;
    let env = learner_env(&state.paths, &lesson_id, EditorMode::NoOp);
    let marks = read_marks(&state.paths.lesson_state(&lesson_id)).map_err(anyhow_err)?;
    let root = state.paths.lesson_root(&lesson_id);
    let no_answers = HashMap::new();
    let ctx = CheckContext {
        root: &root,
        default_repo: lesson.meta.repo.as_deref(),
        env: &env,
        marks: &marks,
        commands: &[],
        questions: &goal.questions,
        answers: &no_answers,
        cwd: None,
    };
    // `@mark:` is for solution.yaml only; a learner who read setup.sh must
    // still find the commit.
    let mark_syntax = value.as_str().is_some_and(|v| v.trim_start().starts_with("@mark:"));
    let correct = !mark_syntax && check_answer(q, &value, &ctx);
    state.db.lock().unwrap().set_answer(&lesson_id, &question, &value, correct).map_err(anyhow_err)?;
    with_session(&state, |s| {
        s.request_refresh();
        Ok(())
    })?;
    Ok(correct)
}

#[tauri::command]
pub async fn run_action(state: State<'_, AppState>, action: String) -> CmdResult<String> {
    let lesson_id = with_session(&state, |s| Ok(s.lesson_id.clone()))?;
    let lesson = lesson_by_id(&state, &lesson_id)?;
    let lib = state.catalog.read().unwrap().lib_dir();
    let paths = state.paths.clone();
    let out = tauri::async_runtime::spawn_blocking(move || core_run_action(&paths, &lib, &lesson, &action))
        .await
        .map_err(err)?
        .map_err(anyhow_err)?;
    with_session(&state, |s| {
        s.request_refresh();
        Ok(())
    })?;
    Ok(out)
}

/// Resolve a path relative to the running lesson's root, refusing to leave it.
fn in_root(state: &AppState, rel: &str) -> CmdResult<PathBuf> {
    let root = with_session(state, |s| Ok(s.root.clone()))?;
    let root = fs::canonicalize(&root).map_err(err)?;
    let path = fs::canonicalize(root.join(rel)).map_err(err)?;
    if !path.starts_with(&root) {
        return Err("path is outside the lesson folder".into());
    }
    Ok(path)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirEntry {
    name: String,
    path: String,
    dir: bool,
    size: u64,
}

#[tauri::command]
pub fn list_dir(state: State<AppState>, path: String) -> CmdResult<Vec<DirEntry>> {
    let dir = in_root(&state, &path)?;
    let root = fs::canonicalize(with_session(&state, |s| Ok(s.root.clone()))?).map_err(err)?;
    let mut entries: Vec<DirEntry> = fs::read_dir(&dir)
        .map_err(err)?
        .flatten()
        .filter_map(|e| {
            let meta = e.metadata().ok()?;
            let p = e.path();
            Some(DirEntry {
                name: e.file_name().to_string_lossy().into_owned(),
                path: p.strip_prefix(&root).ok()?.to_string_lossy().into_owned(),
                dir: meta.is_dir(),
                size: meta.len(),
            })
        })
        .collect();
    entries.sort_by(|a, b| b.dir.cmp(&a.dir).then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase())));
    Ok(entries)
}

const MAX_EDIT_BYTES: u64 = 1024 * 1024;

#[tauri::command]
pub fn read_file(state: State<AppState>, path: String) -> CmdResult<String> {
    let p = in_root(&state, &path)?;
    if fs::metadata(&p).map_err(err)?.len() > MAX_EDIT_BYTES {
        return Err("This file is too large to open in the editor.".into());
    }
    let bytes = fs::read(&p).map_err(err)?;
    if bytes.contains(&0) {
        return Err("This is a binary file.".into());
    }
    String::from_utf8(bytes).map_err(|_| "This file is not UTF-8 text.".into())
}

#[tauri::command]
pub fn write_file(state: State<AppState>, path: String, content: String) -> CmdResult<()> {
    let p = in_root(&state, &path)?;
    if p.is_dir() {
        return Err("That is a folder.".into());
    }
    fs::write(&p, content).map_err(err)
}

#[tauri::command]
pub fn editor_finish(state: State<AppState>, id: String, content: Option<String>) -> CmdResult<()> {
    editor::finish(&state.paths.editor_requests(), &state.paths.workspace(), &id, content.as_deref())
        .map_err(anyhow_err)
}

#[tauri::command]
pub fn get_settings(state: State<AppState>) -> CmdResult<HashMap<String, String>> {
    state.db.lock().unwrap().settings().map_err(anyhow_err)
}

#[tauri::command]
pub fn set_setting(state: State<AppState>, key: String, value: String) -> CmdResult<()> {
    state.db.lock().unwrap().set_setting(&key, &value).map_err(anyhow_err)
}

/// Clear completion for one section, or for everything.
#[tauri::command]
pub fn reset_progress(state: State<AppState>, section: Option<u32>) -> CmdResult<()> {
    let ids: Vec<String> = state
        .catalog
        .read()
        .unwrap()
        .lessons
        .iter()
        .filter(|l| section.is_none_or(|s| l.meta.section == s))
        .map(|l| l.meta.id.clone())
        .collect();
    state.db.lock().unwrap().clear_completion(&ids).map_err(anyhow_err)
}

fn session_repo(state: &AppState, repo: &str) -> CmdResult<canopy_core::git::Git> {
    let lesson_id = with_session(state, |s| Ok(s.lesson_id.clone()))?;
    let dir = in_root(state, repo)?;
    Ok(canopy_core::git::Git::new(dir, learner_env(&state.paths, &lesson_id, EditorMode::NoOp)))
}

/// Unified diff for the Changes tab. scope: "unstaged" | "staged" | "head" | "commit:<id>".
#[tauri::command]
pub fn repo_diff(state: State<AppState>, repo: String, scope: String) -> CmdResult<String> {
    let git = session_repo(&state, &repo)?;
    let mut args = vec!["diff", "--no-color", "--no-ext-diff"];
    let commit;
    match scope.as_str() {
        "unstaged" => {}
        "staged" => args.push("--cached"),
        "head" => args.push("HEAD"),
        other => {
            commit = other.strip_prefix("commit:").ok_or("bad diff scope")?.to_string();
            if !commit.chars().all(|c| c.is_ascii_hexdigit()) {
                return Err("bad commit id".into());
            }
            args = vec!["show", "--no-color", "--no-ext-diff", "--format=%h %s%n%an, %ad%n", &commit];
        }
    }
    git.try_run(&args).map_err(anyhow_err).map(|o| o.unwrap_or_default())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AreaRow {
    path: String,
    worktree: Option<String>,
    index: Option<String>,
    head: Option<String>,
}

const AREA_MAX_PATHS: usize = 40;
const AREA_MAX_BYTES: usize = 4096;

/// Three versions of every file for the Areas tab: working tree, staging, HEAD.
#[tauri::command]
pub fn three_areas(state: State<AppState>, repo: String) -> CmdResult<Vec<AreaRow>> {
    let git = session_repo(&state, &repo)?;
    let mut paths: Vec<String> = Vec::new();
    let mut add = |p: &str| {
        if !p.is_empty() && !paths.iter().any(|x| x == p) {
            paths.push(p.to_string());
        }
    };
    for p in git.try_run(&["ls-files", "--cached", "--others", "--exclude-standard"]).map_err(anyhow_err)?.unwrap_or_default().lines() {
        add(p);
    }
    for p in git.try_run(&["ls-tree", "-r", "--name-only", "HEAD"]).map_err(anyhow_err)?.unwrap_or_default().lines() {
        add(p);
    }
    paths.sort();
    paths.truncate(AREA_MAX_PATHS);
    let clip = |s: String| -> String {
        if s.len() <= AREA_MAX_BYTES {
            return s;
        }
        let mut end = AREA_MAX_BYTES;
        while !s.is_char_boundary(end) {
            end -= 1;
        }
        s[..end].to_string()
    };
    paths
        .into_iter()
        .map(|path| {
            let worktree = fs::read(git.dir.join(&path)).ok().map(|b| clip(String::from_utf8_lossy(&b).into_owned()));
            let index = git.try_run(&["show", &format!(":{path}")]).map_err(anyhow_err)?.map(clip);
            let head = git.try_run(&["show", &format!("HEAD:{path}")]).map_err(anyhow_err)?.map(clip);
            Ok(AreaRow { path, worktree, index, head })
        })
        .collect()
}

/// `git cat-file -p` for the .git tab; also returns the type.
#[tauri::command]
pub fn git_object(state: State<AppState>, repo: String, spec: String) -> CmdResult<(String, String)> {
    let git = session_repo(&state, &repo)?;
    if spec.starts_with('-') {
        return Err("bad object name".into());
    }
    let ty = git.try_run(&["cat-file", "-t", &spec]).map_err(anyhow_err)?.ok_or("No object with that name.")?;
    let body = git.run(&["cat-file", "-p", &spec]).map_err(anyhow_err)?;
    Ok((ty.trim().to_string(), body))
}

#[tauri::command]
pub async fn check_updates(state: State<'_, AppState>) -> CmdResult<crate::updates::CheckResult> {
    let installed = state.catalog.read().unwrap().manifest.content_version.clone();
    tauri::async_runtime::spawn_blocking(move || crate::updates::check(&installed))
        .await
        .map_err(err)?
        .map_err(anyhow_err)
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateProgress {
    done: u64,
    total: u64,
}

/// Download, verify and install a lesson pack, then reload the catalog.
/// Returns true if the open lesson's content changed.
#[tauri::command]
pub async fn install_update(app: AppHandle, state: State<'_, AppState>, feed: crate::updates::Feed) -> CmdResult<bool> {
    use tauri::Emitter;
    let paths = state.paths.clone();
    let app2 = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        crate::updates::install(&paths, &feed, |done, total| {
            let _ = app2.emit("update-progress", UpdateProgress { done, total });
        })
    })
    .await
    .map_err(err)?
    .map_err(anyhow_err)?;

    let open = with_session(&state, |s| Ok(s.lesson_id.clone())).ok();
    let before = open.as_ref().and_then(|id| lesson_fingerprint(&state, id));
    let catalog = crate::content::load_catalog(&app, &state.paths).map_err(anyhow_err)?;
    *state.catalog.write().unwrap() = std::sync::Arc::new(catalog);
    let after = open.as_ref().and_then(|id| lesson_fingerprint(&state, id));
    Ok(open.is_some() && before != after)
}

/// Concatenated lesson files, to tell whether an update changed a lesson.
fn lesson_fingerprint(state: &AppState, id: &str) -> Option<String> {
    let lesson = state.catalog.read().unwrap().lesson(id).cloned()?;
    let mut s = String::new();
    for f in ["lesson.yaml", "content.md", "setup.sh", "goal.json"] {
        s.push_str(&fs::read_to_string(lesson.dir.join(f)).unwrap_or_default());
    }
    Some(s)
}

/// Frontend errors and logs, printed to stderr (visible when Canopy is
/// started from a terminal).
#[tauri::command]
pub fn frontend_log(level: String, message: String) {
    eprintln!("[frontend {level}] {message}");
}

/// Smoke test hook: CANOPY_SMOKE_LESSON=<id> opens that lesson after boot and
/// types a command (see src/main.tsx). Unset in normal use.
#[tauri::command]
pub fn smoke_lesson() -> Option<String> {
    std::env::var("CANOPY_SMOKE_LESSON").ok().filter(|s| !s.is_empty())
}
