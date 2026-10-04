//! Test harness: run setup, feed solution.yaml into the learner shell, then
//! evaluate goals. Used by `canopy-lesson test` and CI.

use std::collections::{HashMap, HashSet};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::mpsc;
use std::time::{Duration, Instant};

use anyhow::{Context, Result};

use crate::catalog::{Catalog, Lesson};
use crate::check::{check_answer, evaluate_goals, CheckContext, GoalResult};
use crate::env::{learner_env, setup_env, shell_path, AppPaths, EditorMode};
use crate::marker::{Chunk, CommandEntry, MarkerParser, PromptEvent};
use crate::runner::{prepare, read_marks};

#[derive(Debug)]
pub struct TestReport {
    pub lesson: String,
    /// Goals that already pass right after setup (before any command).
    pub passing_at_start: Vec<String>,
    pub goals: Vec<GoalResult>,
    /// Question ids whose solution answer is wrong.
    pub wrong_answers: Vec<String>,
    pub commands: Vec<CommandEntry>,
    pub transcript: String,
    pub timed_out: bool,
}

impl TestReport {
    pub fn passed(&self) -> bool {
        !self.timed_out
            && self.wrong_answers.is_empty()
            && self.goals.iter().all(|g| g.passed)
            && self.passing_at_start.len() < self.goals.len()
    }
}

pub fn test_lesson(catalog: &Catalog, lesson: &Lesson, data_dir: &Path) -> Result<TestReport> {
    test_lesson_with(catalog, lesson, data_dir, lesson.solution()?)
}

/// Like `test_lesson` but with another solution (to try alternative approaches).
pub fn test_lesson_with(
    catalog: &Catalog,
    lesson: &Lesson,
    data_dir: &Path,
    solution: crate::catalog::Solution,
) -> Result<TestReport> {
    let paths = AppPaths::new(data_dir);
    let lib = catalog.lib_dir();
    let id = lesson.meta.id.clone();
    let attempt = prepare(&paths, &lib, lesson)?;
    let goal = lesson.goal()?;
    let env = learner_env(&paths, &id, EditorMode::NoOp);
    let marks = read_marks(&attempt.state)?;

    let empty_answers = HashMap::new();
    let start_ctx = CheckContext {
        root: &attempt.root,
        default_repo: lesson.meta.repo.as_deref(),
        env: &env,
        marks: &marks,
        commands: &[],
        questions: &goal.questions,
        answers: &empty_answers,
        cwd: Some(&attempt.start),
    };
    // Like the app, the first check happens when the lesson opens, so sticky
    // goals can already latch here.
    let mut sticky = HashSet::new();
    let passing_at_start = evaluate_goals(&goal, &start_ctx, &mut sticky)
        .into_iter()
        .filter(|g| g.passed)
        .map(|g| g.label)
        .collect();

    // Shell input, one entry per line. Actions run with the setup
    // environment; the leading space keeps them out of the learner's history.
    let setup_vars = setup_env(&paths, &lib, &lesson.dir, &id);
    let mut lines: Vec<String> = Vec::new();
    for line in solution.commands.lines() {
        let t = line.trim();
        if let Some(action_id) = t.strip_prefix("#action ") {
            let action = lesson
                .meta
                .actions
                .iter()
                .find(|a| a.id == action_id.trim())
                .with_context(|| format!("unknown action {action_id}"))?;
            // PATH comes from the running shell: Git Bash has already turned
            // the Windows PATH into its own form.
            let vars: Vec<String> = setup_vars
                .iter()
                .filter(|(k, _)| k != "PATH")
                .map(|(k, v)| format!("{k}={}", shell_quote(v)))
                .collect();
            // The environment goes in a small runner script so the typed line
            // stays short (Windows' console mangles very long input lines).
            let runner = attempt.state.join(format!("run-{}.sh", action.id));
            std::fs::write(
                &runner,
                format!(
                    "cd {} && exec env -i PATH=\"$PATH\" {} bash {}\n",
                    shell_quote(&shell_path(&attempt.root)),
                    vars.join(" "),
                    shell_quote(&shell_path(&lesson.dir.join(&action.script)))
                ),
            )?;
            lines.push(format!(" bash {}", shell_quote(&shell_path(&runner))));
        } else if t.is_empty() || t.starts_with('#') {
            continue;
        } else {
            lines.push(line.to_string());
        }
    }

    let answers: HashMap<String, serde_json::Value> = solution.answers.into_iter().collect();
    let mut commands: Vec<CommandEntry> = Vec::new();
    let mut cwd: Option<PathBuf> = None;
    let mut transcript = String::new();

    // Drive the shell like a learner: send a line, wait for the prompt
    // marker, re-check goals (so sticky goals behave as in the app). A line
    // that produces no prompt within a moment is taken as input for a
    // waiting command (e.g. `add -p` answers or a multi-line quote).
    let mut shell = Shell::spawn(&attempt.start, &env)?;
    let mut parser = MarkerParser::new();
    let started = Instant::now();
    let mut timed_out = false;
    shell.wait_prompt(&mut parser, &mut transcript, Duration::from_secs(10));
    for line in lines.iter().chain(std::iter::once(&"exit".to_string())) {
        if started.elapsed() > TOTAL_TIMEOUT {
            timed_out = true;
            break;
        }
        shell.send(line);
        if line == "exit" {
            break;
        }
        for ev in shell.wait_prompt(&mut parser, &mut transcript, LINE_WAIT) {
            cwd = Some(PathBuf::from(&ev.cwd));
            if let Some(c) = parser.command_for(&ev, 0) {
                transcript.push_str(&format!("[{} -> exit {}]\n", c.command, c.exit_code));
                commands.push(c);
            }
            // Like the app: re-check after every prompt (actions included),
            // with marks re-read because actions may add some.
            let marks = read_marks(&attempt.state)?;
            let ctx = CheckContext {
                root: &attempt.root,
                default_repo: lesson.meta.repo.as_deref(),
                env: &env,
                marks: &marks,
                commands: &commands,
                questions: &goal.questions,
                answers: &empty_answers,
                cwd: cwd.as_deref(),
            };
            evaluate_goals(&goal, &ctx, &mut sticky);
        }
    }
    let stderr = shell.finish(&mut parser, &mut transcript, started);
    if stderr.is_none() {
        timed_out = true;
    }
    let stderr = stderr.unwrap_or_default();
    if !stderr.trim().is_empty() {
        transcript.push_str("--- stderr ---\n");
        transcript.push_str(&stderr);
    }

    let ctx = CheckContext {
        root: &attempt.root,
        default_repo: lesson.meta.repo.as_deref(),
        env: &env,
        marks: &marks,
        commands: &commands,
        questions: &goal.questions,
        answers: &answers,
        cwd: cwd.as_deref().or(Some(&attempt.start)),
    };
    let marks = read_marks(&attempt.state)?;
    let ctx = CheckContext {
        marks: &marks,
        ..ctx
    };
    let wrong_answers = goal
        .questions
        .iter()
        .filter(|q| !answers.get(&q.id).is_some_and(|v| check_answer(q, v, &ctx)))
        .map(|q| q.id.clone())
        .collect();
    let goals = evaluate_goals(&goal, &ctx, &mut sticky);

    Ok(TestReport {
        lesson: id,
        passing_at_start,
        goals,
        wrong_answers,
        commands,
        transcript,
        timed_out,
    })
}

const TOTAL_TIMEOUT: Duration = Duration::from_secs(120);
/// How long to wait for a prompt before treating the next line as input.
const LINE_WAIT: Duration = Duration::from_millis(1500);

/// The learner's shell in a real PTY, exactly as the app runs it, so commands
/// that check for a terminal (pagers, `shortlog`, `add -p`) behave the same.
struct Shell {
    child: Box<dyn portable_pty::Child + Send + Sync>,
    writer: Option<Box<dyn Write + Send>>,
    _master: Box<dyn portable_pty::MasterPty + Send>,
    out: mpsc::Receiver<Vec<u8>>,
}

impl Shell {
    fn spawn(cwd: &Path, env: &[(String, String)]) -> Result<Shell> {
        use portable_pty::{native_pty_system, CommandBuilder, PtySize};
        let pair = native_pty_system()
            .openpty(PtySize {
                cols: 200,
                rows: 50,
                pixel_width: 0,
                pixel_height: 0,
            })
            .context("opening a terminal")?;
        let mut cmd = CommandBuilder::new(crate::env::bash());
        cmd.args(["--noprofile", "--norc", "-i"]);
        cmd.cwd(cwd);
        cmd.env_clear();
        for (k, v) in env {
            cmd.env(k, v);
        }
        for (k, v) in crate::env::shell_extras() {
            cmd.env(k, v);
        }
        let child = pair.slave.spawn_command(cmd).context("starting bash")?;
        drop(pair.slave);
        let mut reader = pair.master.try_clone_reader()?;
        let writer = pair.master.take_writer()?;
        let (tx, rx) = mpsc::channel();
        std::thread::spawn(move || {
            let mut buf = [0u8; 8192];
            while let Ok(n) = reader.read(&mut buf) {
                if n == 0 || tx.send(buf[..n].to_vec()).is_err() {
                    break;
                }
            }
        });
        Ok(Shell {
            child,
            writer: Some(writer),
            _master: pair.master,
            out: rx,
        })
    }

    fn send(&mut self, line: &str) {
        if let Some(w) = self.writer.as_mut() {
            let _ = w.write_all(format!("{line}\n").as_bytes());
            let _ = w.flush();
        }
    }

    /// Answer terminal queries a real terminal (xterm.js in the app) would:
    /// Windows' ConPTY asks for the cursor position (ESC[6n) at start-up and
    /// waits for the reply before running anything.
    fn answer_queries(&mut self, data: &[u8]) {
        if data.windows(4).any(|w| w == b"\x1b[6n") {
            if let Some(w) = self.writer.as_mut() {
                let _ = w.write_all(b"\x1b[1;1R");
                let _ = w.flush();
            }
        }
    }

    /// Read output until a prompt marker arrives or `wait` passes without one.
    fn wait_prompt(
        &mut self,
        parser: &mut MarkerParser,
        transcript: &mut String,
        wait: Duration,
    ) -> Vec<PromptEvent> {
        let deadline = Instant::now() + wait;
        let mut events = Vec::new();
        while events.is_empty() {
            let left = deadline.saturating_duration_since(Instant::now());
            let Ok(data) = self.out.recv_timeout(left) else {
                break;
            };
            self.answer_queries(&data);
            for chunk in parser.feed(&data) {
                match chunk {
                    Chunk::Output(b) => transcript.push_str(&String::from_utf8_lossy(&b)),
                    Chunk::Prompt(ev) => events.push(ev),
                }
            }
        }
        events
    }

    /// Wait for the shell to exit (after `exit` was sent). Some(()) unless it timed out.
    fn finish(
        mut self,
        parser: &mut MarkerParser,
        transcript: &mut String,
        started: Instant,
    ) -> Option<String> {
        loop {
            while let Ok(data) = self.out.try_recv() {
                self.answer_queries(&data);
                for chunk in parser.feed(&data) {
                    if let Chunk::Output(b) = chunk {
                        transcript.push_str(&String::from_utf8_lossy(&b));
                    }
                }
            }
            if self.child.try_wait().ok().flatten().is_some() {
                break;
            }
            if started.elapsed() > TOTAL_TIMEOUT {
                let _ = self.child.kill();
                return None;
            }
            std::thread::sleep(Duration::from_millis(20));
        }
        self.writer.take();
        Some(String::new())
    }
}

pub fn shell_quote(s: &str) -> String {
    format!("'{}'", s.replace('\'', "'\\''"))
}
