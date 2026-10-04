//! App folders and the environments for setup scripts and the learner's shell
//! (docs/ARCHITECTURE.md section 8).

use std::fs;
use std::path::{Path, PathBuf};

use anyhow::Result;

/// Everything Canopy keeps on disk outside the content folder.
#[derive(Debug, Clone)]
pub struct AppPaths {
    /// Root of app data, e.g. ~/.local/share/com.canopy.app
    pub data: PathBuf,
}

impl AppPaths {
    pub fn new(data: impl Into<PathBuf>) -> Self {
        AppPaths { data: data.into() }
    }

    /// Parent of every lesson attempt folder. Used as GIT_CEILING_DIRECTORIES.
    pub fn workspace(&self) -> PathBuf {
        self.data.join("workspace")
    }

    /// The folder the learner works in for one lesson (LESSON_ROOT).
    pub fn lesson_root(&self, id: &str) -> PathBuf {
        self.workspace().join(id)
    }

    /// Private per-attempt state (marks, clock, shell history). Kept outside
    /// LESSON_ROOT so it never shows up in `ls -a`.
    pub fn lesson_state(&self, id: &str) -> PathBuf {
        self.data.join("state").join(id)
    }

    pub fn git_dir(&self) -> PathBuf {
        self.data.join("git")
    }

    /// Defaults every lesson's global config includes.
    pub fn base_config(&self) -> PathBuf {
        self.git_dir().join("base.gitconfig")
    }

    /// The learner's own identity, carried from lesson to lesson.
    pub fn profile_config(&self) -> PathBuf {
        self.git_dir().join("profile.gitconfig")
    }

    /// Per-attempt "global" config (GIT_CONFIG_GLOBAL). Lessons may change it
    /// freely (aliases, excludes, includes) without affecting other lessons;
    /// Reset lesson starts it over.
    pub fn global_config(&self, lesson_id: &str) -> PathBuf {
        self.lesson_state(lesson_id).join("global.gitconfig")
    }

    /// Per-attempt "system" config (GIT_CONFIG_SYSTEM): the fallback identity.
    pub fn system_config(&self, lesson_id: &str) -> PathBuf {
        self.lesson_state(lesson_id).join("system.gitconfig")
    }

    /// HOME for the learner's shell, so `~`, gpg and ssh keys stay inside Canopy.
    pub fn home(&self) -> PathBuf {
        self.data.join("home")
    }

    pub fn bin(&self) -> PathBuf {
        self.data.join("bin")
    }

    /// Where the editor script drops requests for the in-app editor.
    pub fn editor_requests(&self) -> PathBuf {
        self.data.join("editor")
    }

    pub fn editor_script(&self) -> PathBuf {
        self.bin().join("canopy-editor")
    }

    /// Create folders and default config files. Safe to call on every start.
    pub fn ensure(&self) -> Result<()> {
        for dir in [
            self.workspace(),
            self.git_dir(),
            self.home(),
            self.bin(),
            self.editor_requests(),
        ] {
            fs::create_dir_all(dir)?;
        }
        fs::write(self.base_config(), BASE_CONFIG)?;
        if !self.profile_config().exists() {
            fs::write(
                self.profile_config(),
                "# Your name and email, kept between lessons.\n",
            )?;
        }
        write_executable(&self.editor_script(), EDITOR_SCRIPT)?;
        Ok(())
    }
}

const BASE_CONFIG: &str = "\
# Canopy's defaults. Your real ~/.gitconfig is never read or changed.
[init]
\tdefaultBranch = main
[protocol \"file\"]
\tallow = always
";

/// Prompt hook for the learner's shell (passed via the environment so the
/// shell can run with --norc). After every command it prints a hidden OSC
/// marker: ESC ] 7770 ; <exit> ; <cwd> US <history line> BEL.
pub const PROMPT_COMMAND: &str = r#"__canopy_ec=$?; __canopy_h=$(history 1); __canopy_h=${__canopy_h//[$'\a\e']/}; printf '\e]7770;%s;%s\x1f%s\a' "$__canopy_ec" "$PWD" "$__canopy_h""#;

/// Prompt: folder, then the branch (or short id when detached) and any
/// operation in progress, e.g. `project (main|MERGING) $ `.
/// Coloured ls and grep for the interactive shell only, without an rc file:
/// bash imports exported functions from the environment, even with --norc.
pub const SHELL_FUNCTIONS: [(&str, &str); 2] = [
    ("BASH_FUNC_ls%%", "() {  command ls --color=auto \"$@\"\n}"),
    (
        "BASH_FUNC_grep%%",
        "() {  command grep --color=auto \"$@\"\n}",
    ),
];

pub const PS1: &str = r#"\[\e[1;34m\]\W\[\e[0m\]$(__b=$(git symbolic-ref --short -q HEAD 2>/dev/null || git rev-parse --short -q HEAD 2>/dev/null); if [ -n "$__b" ]; then __d=$(git rev-parse --git-dir 2>/dev/null); __o=; if [ -f "$__d/rebase-apply/applying" ]; then __o="|AM"; elif [ -d "$__d/rebase-merge" ] || [ -d "$__d/rebase-apply" ]; then __o="|REBASING"; elif [ -f "$__d/MERGE_HEAD" ]; then __o="|MERGING"; elif [ -f "$__d/CHERRY_PICK_HEAD" ]; then __o="|CHERRY-PICKING"; elif [ -f "$__d/REVERT_HEAD" ]; then __o="|REVERTING"; elif [ -f "$__d/BISECT_LOG" ]; then __o="|BISECTING"; fi; printf ' \001\e[32m\002(%s\001\e[1;33m\002%s\001\e[0;32m\002)\001\e[0m\002' "$__b" "$__o"; fi) \$ "#;

/// GIT_EDITOR / GIT_SEQUENCE_EDITOR. Asks the app to open the file in the
/// in-app editor and waits until the learner saves (exit 0) or cancels (exit 1).
const EDITOR_SCRIPT: &str = r#"#!/bin/sh
dir="${CANOPY_EDITOR_DIR:?}"
id="$$-$(date +%s)"
file="$1"
case "$file" in /*) ;; *) file="$PWD/$file" ;; esac
printf '%s\n' "$file" > "$dir/$id.req.tmp" && mv "$dir/$id.req.tmp" "$dir/$id.req"
printf 'Waiting for you to save the file in the Canopy editor...\n' >&2
while [ ! -e "$dir/$id.done" ] && [ ! -e "$dir/$id.cancel" ]; do sleep 0.1; done
rm -f "$dir/$id.req"
if [ -e "$dir/$id.cancel" ]; then rm -f "$dir/$id.cancel"; exit 1; fi
rm -f "$dir/$id.done"
exit 0
"#;

fn write_executable(path: &Path, body: &str) -> Result<()> {
    fs::write(path, body)?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(path, fs::Permissions::from_mode(0o755))?;
    }
    Ok(())
}

pub type EnvVars = Vec<(String, String)>;

/// Variables passed through from the parent process. Everything else
/// (including any GIT_* the developer has set) is dropped.
fn base_env() -> EnvVars {
    let mut env = Vec::new();
    for key in [
        "PATH",
        "LANG",
        "LC_ALL",
        "LC_CTYPE",
        "USER",
        "LOGNAME",
        "TMPDIR",
        "DISPLAY",
        "WAYLAND_DISPLAY",
        "XDG_RUNTIME_DIR",
    ] {
        if let Ok(v) = std::env::var(key) {
            env.push((key.to_string(), v));
        }
    }
    if !env.iter().any(|(k, _)| k == "LANG") {
        env.push(("LANG".into(), "C.UTF-8".into()));
    }
    env
}

fn s(p: &Path) -> String {
    p.to_string_lossy().into_owned()
}

/// Environment for setup.sh and actions/*.sh.
pub fn setup_env(paths: &AppPaths, lib: &Path, lesson_dir: &Path, lesson_id: &str) -> EnvVars {
    let state = paths.lesson_state(lesson_id);
    let mut env = base_env();
    env.extend([
        ("HOME".into(), s(&state.join("home"))),
        ("LESSON_ROOT".into(), s(&paths.lesson_root(lesson_id))),
        ("LESSON_DIR".into(), s(lesson_dir)),
        ("CANOPY_LIB".into(), s(lib)),
        ("CANOPY_STATE".into(), s(&state)),
        (
            "GIT_CONFIG_GLOBAL".into(),
            s(&state.join("setup.gitconfig")),
        ),
        ("GIT_CONFIG_NOSYSTEM".into(), "1".into()),
        ("GIT_CEILING_DIRECTORIES".into(), s(&paths.workspace())),
        // Lessons read refs as files (5.12, section 14); pin that format in
        // case a future git defaults to reftable. Ignored by older git.
        ("GIT_DEFAULT_REF_FORMAT".into(), "files".into()),
    ]);
    env
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EditorMode {
    /// Route editors to the in-app editor (the app).
    App,
    /// Accept the default message without editing (test harness).
    NoOp,
}

/// Environment for the learner's shell and for read-only git calls made by
/// the app (snapshots, goal checks).
pub fn learner_env(paths: &AppPaths, lesson_id: &str, editor: EditorMode) -> EnvVars {
    let mut env = base_env();
    let editor_cmd = match editor {
        EditorMode::App => s(&paths.editor_script()),
        EditorMode::NoOp => "true".into(),
    };
    env.extend([
        ("HOME".into(), s(&paths.home())),
        ("TERM".into(), "xterm-256color".into()),
        ("COLORTERM".into(), "truecolor".into()),
        (
            "GIT_CONFIG_GLOBAL".into(),
            s(&paths.global_config(lesson_id)),
        ),
        (
            "GIT_CONFIG_SYSTEM".into(),
            s(&paths.system_config(lesson_id)),
        ),
        // git also reads $XDG_CONFIG_HOME/git/{config,ignore,attributes};
        // keep those per attempt too so nothing leaks between lessons.
        (
            "XDG_CONFIG_HOME".into(),
            s(&paths.lesson_state(lesson_id).join("xdg")),
        ),
        ("GIT_CEILING_DIRECTORIES".into(), s(&paths.workspace())),
        ("GIT_PAGER".into(), "cat".into()),
        ("GIT_DEFAULT_REF_FORMAT".into(), "files".into()),
        ("PAGER".into(), "cat".into()),
        ("GIT_EDITOR".into(), editor_cmd.clone()),
        ("GIT_SEQUENCE_EDITOR".into(), editor_cmd.clone()),
        ("EDITOR".into(), editor_cmd.clone()),
        ("VISUAL".into(), editor_cmd),
        ("CANOPY_EDITOR_DIR".into(), s(&paths.editor_requests())),
        (
            "HISTFILE".into(),
            s(&paths.lesson_state(lesson_id).join("bash_history")),
        ),
        ("HISTSIZE".into(), "5000".into()),
        ("HISTCONTROL".into(), "ignorespace".into()),
        ("PS1".into(), PS1.into()),
        ("PROMPT_COMMAND".into(), PROMPT_COMMAND.into()),
        ("CANOPY_LESSON".into(), lesson_id.into()),
    ]);
    env
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{Duration, Instant};

    /// The editor script waits for the app, then exits 0 on save, 1 on cancel.
    #[test]
    fn editor_script_round_trip() {
        let dir = std::env::temp_dir().join(format!("canopy-editor-{}", std::process::id()));
        let paths = AppPaths::new(&dir);
        paths.ensure().unwrap();
        let file = dir.join("COMMIT_EDITMSG");
        for (answer, code) in [("done", 0), ("cancel", 1)] {
            fs::write(&file, "msg").unwrap();
            let mut child = std::process::Command::new(paths.editor_script())
                .arg(&file)
                .env("CANOPY_EDITOR_DIR", paths.editor_requests())
                .stderr(std::process::Stdio::null())
                .spawn()
                .unwrap();
            let deadline = Instant::now() + Duration::from_secs(5);
            let req = loop {
                let found = fs::read_dir(paths.editor_requests())
                    .unwrap()
                    .flatten()
                    .find(|e| e.file_name().to_string_lossy().ends_with(".req"));
                if let Some(e) = found {
                    break e.path();
                }
                assert!(Instant::now() < deadline, "no request appeared");
                std::thread::sleep(Duration::from_millis(20));
            };
            assert_eq!(
                fs::read_to_string(&req).unwrap().trim(),
                file.to_string_lossy()
            );
            let id = req.file_stem().unwrap().to_string_lossy().into_owned();
            fs::write(paths.editor_requests().join(format!("{id}.{answer}")), "").unwrap();
            assert_eq!(child.wait().unwrap().code(), Some(code));
            assert!(!req.exists());
        }
        fs::remove_dir_all(&dir).ok();
    }
}
