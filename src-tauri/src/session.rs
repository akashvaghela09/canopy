//! A running lesson: the learner's PTY shell, the command log, the file
//! watcher and the worker that re-checks goals and takes snapshots.

use std::collections::{HashMap, HashSet};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::mpsc::{channel, Receiver, Sender};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use anyhow::{Context, Result};
use canopy_core::catalog::Lesson;
use canopy_core::check::{evaluate_goals, CheckContext, GoalResult};
use canopy_core::env::{learner_env, AppPaths, EditorMode, EnvVars};
use canopy_core::git::Git;
use canopy_core::goal::GoalFile;
use canopy_core::marker::{Chunk, MarkerParser};
use canopy_core::snapshot::{self, Snapshot};
use notify_debouncer_mini::notify::event::ModifyKind;
use notify_debouncer_mini::notify::{
    recommended_watcher, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher,
};
use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};
use serde::Serialize;
use tauri::ipc::Channel;
use tauri::{AppHandle, Emitter};

use crate::db::Db;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RepoSnapshot {
    pub path: String,
    pub label: String,
    pub snapshot: Option<Snapshot>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LessonUpdate {
    pub lesson_id: String,
    pub goals: Vec<GoalResult>,
    pub complete: bool,
    /// True only on the update where the lesson first became complete.
    pub just_completed: bool,
    /// Terminal cwd relative to the lesson root ("" = root, None = outside it).
    pub cwd: Option<String>,
    pub repos: Vec<RepoSnapshot>,
    pub commands: usize,
}

/// State shared between the session's threads.
struct Shared {
    app: AppHandle,
    lesson: Lesson,
    goal: GoalFile,
    root: PathBuf,
    state: PathBuf,
    paths: AppPaths,
    env: EnvVars,
    marks: HashMap<String, String>,
    db: Arc<Mutex<Db>>,
    cwd: Mutex<Option<PathBuf>>,
    was_complete: Mutex<bool>,
}

pub struct Session {
    pub lesson_id: String,
    /// A command was submitted and its prompt has not come back yet.
    busy: Arc<std::sync::atomic::AtomicBool>,
    pub root: PathBuf,
    writer: Mutex<Box<dyn Write + Send>>,
    master: Mutex<Box<dyn MasterPty + Send>>,
    child: Mutex<Box<dyn Child + Send + Sync>>,
    refresh: Sender<()>,
    _watcher: RecommendedWatcher,
}

impl Session {
    #[allow(clippy::too_many_arguments)]
    pub fn start(
        app: AppHandle,
        paths: &AppPaths,
        lesson: Lesson,
        start_dir: &Path,
        marks: HashMap<String, String>,
        db: Arc<Mutex<Db>>,
        output: Channel<String>,
        size: (u16, u16),
        fresh_attempt: bool,
    ) -> Result<Session> {
        let id = lesson.meta.id.clone();
        let root = paths.lesson_root(&id);
        let goal = lesson.goal()?;
        let env = learner_env(paths, &id, EditorMode::App);
        // A reopened, already-finished attempt should not celebrate again; a fresh
        // attempt (including a redo after reset) should.
        let was_complete = !fresh_attempt && db.lock().unwrap().completed()?.contains_key(&id);

        let Shell {
            master,
            child,
            mut reader,
            writer,
        } = spawn_shell(&env, start_dir, size)?;

        let shared = Arc::new(Shared {
            app,
            lesson,
            goal,
            root: root.clone(),
            state: paths.lesson_state(&id),
            paths: paths.clone(),
            env,
            marks,
            db,
            cwd: Mutex::new(Some(start_dir.to_path_buf())),
            was_complete: Mutex::new(was_complete),
        });

        let (refresh_tx, refresh_rx) = channel::<()>();
        let busy = Arc::new(std::sync::atomic::AtomicBool::new(false));

        // Refresh worker: coalesces requests, then checks goals and snapshots.
        {
            let shared = shared.clone();
            std::thread::spawn(move || refresh_loop(shared, refresh_rx));
        }

        // PTY reader: strips prompt markers, logs commands, streams output.
        {
            let shared = shared.clone();
            let refresh = refresh_tx.clone();
            let busy = busy.clone();
            std::thread::spawn(move || {
                let mut parser = MarkerParser::new();
                let mut carry: Vec<u8> = Vec::new();
                let mut buf = [0u8; 16 * 1024];
                loop {
                    let n = match reader.read(&mut buf) {
                        Ok(0) | Err(_) => break,
                        Ok(n) => n,
                    };
                    let mut text = Vec::new();
                    for chunk in parser.feed(&buf[..n]) {
                        match chunk {
                            Chunk::Output(b) => text.extend(b),
                            Chunk::Prompt(ev) => {
                                busy.store(false, std::sync::atomic::Ordering::Relaxed);
                                *shared.cwd.lock().unwrap() = Some(PathBuf::from(&ev.cwd));
                                if let Some(entry) = parser.command_for(&ev, now_ms()) {
                                    let _ = shared
                                        .db
                                        .lock()
                                        .unwrap()
                                        .add_command(&shared.lesson.meta.id, &entry);
                                }
                                let _ = refresh.send(());
                            }
                        }
                    }
                    if !text.is_empty() {
                        carry.extend(text);
                        let valid = utf8_prefix_len(&carry);
                        let s = String::from_utf8_lossy(&carry[..valid]).into_owned();
                        carry.drain(..valid);
                        if output.send(s).is_err() {
                            break;
                        }
                    }
                }
                let _ = shared.app.emit("terminal-exit", &shared.lesson.meta.id);
            });
        }

        // Files changed outside the terminal (editor saves, actions).
        // Only real changes count. Access events (git reading files while we
        // take a snapshot) would otherwise trigger a refresh loop.
        let watch_tx = refresh_tx.clone();
        let mut watcher =
            recommended_watcher(move |res: notify_debouncer_mini::notify::Result<Event>| {
                if let Ok(ev) = res {
                    if is_change(&ev.kind) {
                        let _ = watch_tx.send(());
                    }
                }
            })?;
        watcher.watch(&root, RecursiveMode::Recursive)?;

        let _ = refresh_tx.send(());
        Ok(Session {
            lesson_id: id,
            busy,
            root,
            writer: Mutex::new(writer),
            master: Mutex::new(master),
            child: Mutex::new(child),
            refresh: refresh_tx,
            _watcher: watcher,
        })
    }

    pub fn write(&self, data: &[u8]) -> Result<()> {
        if data.contains(&b'\r') || data.contains(&b'\n') {
            self.busy.store(true, std::sync::atomic::Ordering::Relaxed);
        }
        let mut w = self.writer.lock().unwrap();
        w.write_all(data)?;
        w.flush()?;
        Ok(())
    }

    pub fn resize(&self, cols: u16, rows: u16) -> Result<()> {
        self.master.lock().unwrap().resize(PtySize {
            cols: cols.max(20),
            rows: rows.max(5),
            pixel_width: 0,
            pixel_height: 0,
        })?;
        Ok(())
    }

    /// True while a command typed in the terminal is still running.
    pub fn is_busy(&self) -> bool {
        self.busy.load(std::sync::atomic::Ordering::Relaxed)
    }

    pub fn request_refresh(&self) {
        let _ = self.refresh.send(());
    }
}

impl Drop for Session {
    fn drop(&mut self) {
        let _ = self.child.lock().unwrap().kill();
    }
}

pub struct Shell {
    pub master: Box<dyn MasterPty + Send>,
    pub child: Box<dyn Child + Send + Sync>,
    pub reader: Box<dyn Read + Send>,
    pub writer: Box<dyn Write + Send>,
}

/// Start the learner's bash in a PTY with the given environment.
pub fn spawn_shell(env: &EnvVars, start_dir: &Path, size: (u16, u16)) -> Result<Shell> {
    let pair = native_pty_system()
        .openpty(PtySize {
            cols: size.0.max(20),
            rows: size.1.max(5),
            pixel_width: 0,
            pixel_height: 0,
        })
        .context("opening a terminal")?;
    let mut cmd = CommandBuilder::new(canopy_core::env::bash());
    cmd.args(["--noprofile", "--norc", "-i"]);
    cmd.cwd(start_dir);
    cmd.env_clear();
    for (k, v) in env {
        cmd.env(k, v);
    }
    for (k, v) in canopy_core::env::shell_extras() {
        cmd.env(k, v);
    }
    let child = pair.slave.spawn_command(cmd).context("starting bash")?;
    drop(pair.slave);
    let reader = pair.master.try_clone_reader()?;
    let writer = pair.master.take_writer()?;
    Ok(Shell {
        master: pair.master,
        child,
        reader,
        writer,
    })
}

fn is_change(kind: &EventKind) -> bool {
    match kind {
        EventKind::Create(_) | EventKind::Remove(_) => true,
        EventKind::Modify(ModifyKind::Metadata(_)) => false,
        EventKind::Modify(_) => true,
        _ => false,
    }
}

fn refresh_loop(shared: Arc<Shared>, rx: Receiver<()>) {
    while rx.recv().is_ok() {
        // Coalesce bursts (a command often triggers a marker plus many file events).
        std::thread::sleep(Duration::from_millis(150));
        while rx.try_recv().is_ok() {}
        match compute_update(&shared) {
            Ok(update) => {
                let _ = shared.app.emit("lesson-update", &update);
            }
            Err(e) => eprintln!("refresh failed: {e:#}"),
        }
    }
}

fn compute_update(shared: &Shared) -> Result<LessonUpdate> {
    let id = &shared.lesson.meta.id;
    let (commands, answers, mut sticky) = {
        let db = shared.db.lock().unwrap();
        let answers: HashMap<String, serde_json::Value> = db
            .answers(id)?
            .into_iter()
            .map(|(k, (v, _))| (k, v))
            .collect();
        (db.commands(id)?, answers, db.sticky(id)?)
    };
    let cwd = shared.cwd.lock().unwrap().clone();
    // Actions may add marks while the lesson runs, so read them every time.
    let marks =
        canopy_core::runner::read_marks(&shared.state).unwrap_or_else(|_| shared.marks.clone());
    let _ = canopy_core::runner::sync_profile(&shared.paths, id);
    let ctx = CheckContext {
        root: &shared.root,
        default_repo: shared.lesson.meta.repo.as_deref(),
        env: &shared.env,
        marks: &marks,
        commands: &commands,
        questions: &shared.goal.questions,
        answers: &answers,
        cwd: cwd.as_deref(),
    };
    let before: HashSet<usize> = sticky.clone();
    let goals = evaluate_goals(&shared.goal, &ctx, &mut sticky);
    let complete = !goals.is_empty() && goals.iter().all(|g| g.passed);

    let mut just_completed = false;
    {
        let db = shared.db.lock().unwrap();
        for i in sticky.difference(&before) {
            db.add_sticky(id, *i)?;
        }
        if complete {
            db.mark_complete(id, now_ms())?;
            let mut was = shared.was_complete.lock().unwrap();
            just_completed = !*was;
            *was = true;
        }
    }

    let rel_cwd = cwd.and_then(|c| {
        let c = std::fs::canonicalize(&c).ok()?;
        let r = std::fs::canonicalize(&shared.root).ok()?;
        c.strip_prefix(&r)
            .ok()
            // "/"-separated on every platform: the frontend matches repo paths with "/".
            .map(|p| p.to_string_lossy().replace('\\', "/"))
    });

    Ok(LessonUpdate {
        lesson_id: id.clone(),
        goals,
        complete,
        just_completed,
        cwd: rel_cwd,
        repos: snapshots(shared),
        commands: commands.len(),
    })
}

/// Snapshot every repo the lesson declares (or just its primary repo).
fn snapshots(shared: &Shared) -> Vec<RepoSnapshot> {
    let meta = &shared.lesson.meta;
    let mut list: Vec<(String, String)> = meta
        .repos
        .iter()
        .map(|r| (r.path.clone(), r.label.clone()))
        .collect();
    if let Some(primary) = &meta.repo {
        if !list.iter().any(|(p, _)| p == primary) {
            list.insert(0, (primary.clone(), primary.clone()));
        }
    }
    list.into_iter()
        .map(|(path, label)| {
            let dir = shared.root.join(&path);
            let (snapshot, error) = match canopy_core::git::is_repo_root(&dir, &shared.env) {
                Ok(Some(_)) => match snapshot::take(&Git::new(&dir, shared.env.clone())) {
                    Ok(s) => (Some(s), None),
                    Err(e) => (None, Some(format!("{e:#}"))),
                },
                Ok(None) => (None, None),
                Err(e) => (None, Some(format!("{e:#}"))),
            };
            RepoSnapshot {
                path,
                label,
                snapshot,
                error,
            }
        })
        .collect()
}

/// Length of the longest prefix that does not end in a partial UTF-8 char.
fn utf8_prefix_len(b: &[u8]) -> usize {
    match std::str::from_utf8(b) {
        Ok(_) => b.len(),
        Err(e) if e.error_len().is_none() => e.valid_up_to(),
        Err(_) => b.len(), // invalid bytes: let from_utf8_lossy replace them
    }
}

pub fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::utf8_prefix_len;

    use super::spawn_shell;
    use canopy_core::env::{learner_env, AppPaths, EditorMode};
    use canopy_core::marker::{Chunk, MarkerParser};
    use std::io::{Read, Write};

    /// The real terminal path: PTY + learner env + prompt marker + git.
    #[test]
    fn pty_shell_reports_commands() {
        let dir = std::env::temp_dir().join(format!("canopy-pty-{}", std::process::id()));
        let paths = AppPaths::new(&dir);
        paths.ensure().unwrap();
        let root = paths.lesson_root("t");
        std::fs::create_dir_all(&root).unwrap();
        let env = learner_env(&paths, "t", EditorMode::NoOp);
        let mut sh = spawn_shell(&env, &root, (80, 24)).unwrap();
        sh.writer
            .write_all(b"git init -q -b main repo && cd repo\ngit status --short; false\n")
            .unwrap();
        let (tx, rx) = std::sync::mpsc::channel();
        let mut reader = sh.reader;
        std::thread::spawn(move || {
            let mut buf = [0u8; 4096];
            while let Ok(n) = reader.read(&mut buf) {
                if n == 0 || tx.send(buf[..n].to_vec()).is_err() {
                    break;
                }
            }
        });
        let mut parser = MarkerParser::new();
        let mut cmds = Vec::new();
        let deadline = std::time::Instant::now() + std::time::Duration::from_secs(15);
        while cmds.len() < 2 && std::time::Instant::now() < deadline {
            if let Ok(data) = rx.recv_timeout(std::time::Duration::from_millis(200)) {
                for c in parser.feed(&data) {
                    if let Chunk::Prompt(ev) = c {
                        if let Some(e) = parser.command_for(&ev, 0) {
                            cmds.push(e);
                        }
                    }
                }
            }
        }
        let _ = sh.child.kill();
        std::fs::remove_dir_all(&dir).ok();
        assert_eq!(cmds.len(), 2, "{cmds:?}");
        assert_eq!(cmds[0].command, "git init -q -b main repo && cd repo");
        assert_eq!(cmds[0].exit_code, 0);
        assert!(cmds[0].cwd.ends_with("/repo"), "{}", cmds[0].cwd);
        assert_eq!(cmds[1].exit_code, 1);
    }

    #[test]
    fn utf8_split() {
        let s = "héllo".as_bytes();
        assert_eq!(utf8_prefix_len(&s[..2]), 1); // cut inside é
        assert_eq!(utf8_prefix_len(s), s.len());
    }
}
