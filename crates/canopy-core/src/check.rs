//! Evaluating goal.json checks against a real repo.

use std::collections::{BTreeSet, HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;

use anyhow::{anyhow, bail, Result};
use regex::Regex;
use serde::Serialize;
use serde_json::Value;

use crate::env::EnvVars;
use crate::git::{is_repo_root, Git};
use crate::goal::{Check, CheckKind, GoalFile, Question, QuestionKind};
use crate::marker::CommandEntry;

pub struct CheckContext<'a> {
    pub root: &'a Path,
    pub default_repo: Option<&'a str>,
    pub env: &'a EnvVars,
    pub marks: &'a HashMap<String, String>,
    pub commands: &'a [CommandEntry],
    pub questions: &'a [Question],
    pub answers: &'a HashMap<String, Value>,
    pub cwd: Option<&'a Path>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GoalResult {
    pub label: String,
    pub passed: bool,
    /// Stays passed once reached.
    pub sticky: bool,
    /// The question this goal checks, if it is an answer goal (the UI jumps to it).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub question: Option<String>,
    /// Why a check could not be evaluated (for authors; not shown to learners).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Evaluate every goal. `sticky` holds indexes of sticky goals that already
/// passed in this attempt; it is updated in place.
pub fn evaluate_goals(file: &GoalFile, ctx: &CheckContext, sticky: &mut HashSet<usize>) -> Vec<GoalResult> {
    file.goals
        .iter()
        .enumerate()
        .map(|(i, goal)| {
            let question = match &goal.check.kind {
                CheckKind::Answer { question } => Some(question.clone()),
                _ => None,
            };
            if goal.sticky && sticky.contains(&i) {
                return GoalResult { label: goal.label.clone(), passed: true, sticky: true, question, error: None };
            }
            let (passed, error) = match eval(&goal.check, ctx) {
                Ok(p) => (p, None),
                Err(e) => (false, Some(format!("{e:#}"))),
            };
            if passed && goal.sticky {
                sticky.insert(i);
            }
            GoalResult { label: goal.label.clone(), passed, sticky: goal.sticky, question, error }
        })
        .collect()
}

/// Whether `value` is a correct answer to `question`.
pub fn check_answer(question: &Question, value: &Value, ctx: &CheckContext) -> bool {
    answer_correct(question, value, ctx).unwrap_or(false)
}

fn answer_correct(question: &Question, value: &Value, ctx: &CheckContext) -> Result<bool> {
    Ok(match &question.kind {
        QuestionKind::Choice { answer, answers, .. } => {
            let given: BTreeSet<u64> = match value {
                Value::Array(a) => a.iter().filter_map(Value::as_u64).collect(),
                v => v.as_u64().into_iter().collect(),
            };
            let want: BTreeSet<u64> = match (answer, answers) {
                (_, Some(list)) => list.iter().map(|&x| x as u64).collect(),
                (Some(a), None) => [*a as u64].into(),
                (None, None) => bail!("choice question {} has no answer", question.id),
            };
            given == want
        }
        QuestionKind::Text { accept, case_sensitive } => {
            let given = value_text(value);
            let given = given.trim();
            accept.iter().any(|a| {
                if *case_sensitive {
                    a.trim() == given
                } else {
                    a.trim().to_lowercase() == given.to_lowercase()
                }
            })
        }
        QuestionKind::Number { answer } => {
            let given = match value {
                Value::Number(n) => n.as_i64(),
                v => value_text(v).trim().parse().ok(),
            };
            given == Some(*answer)
        }
        QuestionKind::Commit { answer, repo, allow_refs } => {
            let given = value_text(value);
            let given = given.trim();
            if given.is_empty() || given.starts_with('-') {
                return Ok(false);
            }
            // `@mark:` lets solution.yaml answer without hard-coding hashes.
            let is_mark = given.starts_with("@mark:");
            let is_hex = given.chars().all(|c| c.is_ascii_hexdigit());
            if is_hex && given.len() < 4 {
                return Ok(false);
            }
            if !is_hex && !is_mark && !allow_refs {
                return Ok(false);
            }
            let git = ctx.git(repo.as_deref())?;
            let want = ctx.resolve(&git, answer)?;
            let got = ctx.resolve(&git, given)?;
            want.is_some() && want == got
        }
    })
}

fn value_text(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        Value::Null => String::new(),
        other => other.to_string(),
    }
}

fn mark_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"@mark:([A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*)").unwrap())
}

impl CheckContext<'_> {
    fn repo_path(&self, repo: Option<&str>) -> Result<PathBuf> {
        let rel = repo
            .or(self.default_repo)
            .ok_or_else(|| anyhow!("check needs a repo but the lesson has none"))?;
        Ok(self.root.join(rel))
    }

    fn git(&self, repo: Option<&str>) -> Result<Git> {
        let path = self.repo_path(repo)?;
        if !path.is_dir() {
            bail!("repo folder {} does not exist", path.display());
        }
        Ok(Git::new(path, self.env.clone()))
    }

    /// Replace every `@mark:name` with its commit id.
    fn expand(&self, rev: &str) -> Result<String> {
        let mut missing = None;
        let out = mark_re().replace_all(rev, |c: &regex::Captures| match self.marks.get(&c[1]) {
            Some(sha) => sha.clone(),
            None => {
                missing = Some(c[1].to_string());
                String::new()
            }
        });
        if let Some(m) = missing {
            bail!("unknown mark @mark:{m}");
        }
        Ok(out.into_owned())
    }

    fn resolve(&self, git: &Git, rev: &str) -> Result<Option<String>> {
        git.resolve_commit(&self.expand(rev)?)
    }

    fn must_resolve(&self, git: &Git, rev: &str) -> Result<String> {
        self.resolve(git, rev)?
            .ok_or_else(|| anyhow!("revision {rev:?} does not resolve"))
    }
}

fn text_ok(text: &str, equals: &Option<String>, contains: &Option<String>, not_contains: &Option<String>, matches: &Option<String>) -> Result<bool> {
    if let Some(e) = equals {
        if text.trim_end() != e.trim_end() {
            return Ok(false);
        }
    }
    if let Some(c) = contains {
        if !text.contains(c.as_str()) {
            return Ok(false);
        }
    }
    if let Some(n) = not_contains {
        if text.contains(n.as_str()) {
            return Ok(false);
        }
    }
    if let Some(m) = matches {
        if !Regex::new(m)?.is_match(text) {
            return Ok(false);
        }
    }
    Ok(true)
}

/// Working-tree status lists from `git status --porcelain=v2 -z`.
#[derive(Debug, Default)]
pub struct StatusLists {
    pub staged: Vec<String>,
    pub modified: Vec<String>,
    pub untracked: Vec<String>,
    pub conflicted: Vec<String>,
    pub ignored: Vec<String>,
}

pub fn read_status(git: &Git, ignored: bool) -> Result<StatusLists> {
    let mut args = vec!["status", "--porcelain=v2", "-z", "--untracked-files=all"];
    if ignored {
        args.push("--ignored=matching");
    }
    let raw = git.run(&args)?;
    let mut s = StatusLists::default();
    let mut fields = raw.split('\0');
    while let Some(entry) = fields.next() {
        if entry.is_empty() {
            continue;
        }
        let kind = entry.as_bytes()[0];
        match kind {
            b'1' | b'2' => {
                // 1 XY sub mH mI mW hH hI path / 2 XY sub mH mI mW hH hI Xscore path \0 orig
                let n = if kind == b'1' { 8 } else { 9 };
                let parts: Vec<&str> = entry.splitn(n + 1, ' ').collect();
                let xy = parts.get(1).copied().unwrap_or("..");
                let path = parts.get(n).copied().unwrap_or("").to_string();
                if kind == b'2' {
                    fields.next(); // original path
                }
                let (x, y) = (xy.as_bytes()[0], xy.as_bytes()[1]);
                if x != b'.' {
                    s.staged.push(path.clone());
                }
                if y != b'.' {
                    s.modified.push(path);
                }
            }
            b'u' => {
                let parts: Vec<&str> = entry.splitn(11, ' ').collect();
                s.conflicted.push(parts.get(10).copied().unwrap_or("").to_string());
            }
            b'?' => s.untracked.push(entry[2..].to_string()),
            b'!' => s.ignored.push(entry[2..].to_string()),
            _ => {}
        }
    }
    Ok(s)
}

/// Does `actual` satisfy the expected list? Entries ending in "/" match any
/// path below that folder.
fn list_ok(expected: &[String], actual: &[String], exact: bool) -> bool {
    let matches = |e: &String, a: &String| {
        if let Some(dir) = e.strip_suffix('/') {
            a.starts_with(&format!("{dir}/")) || a == dir
        } else {
            a == e
        }
    };
    let all_found = expected.iter().all(|e| actual.iter().any(|a| matches(e, a)));
    if !exact {
        return all_found;
    }
    all_found && actual.iter().all(|a| expected.iter().any(|e| matches(e, a)))
}

fn same_path(a: &Path, b: &Path) -> bool {
    match (fs::canonicalize(a), fs::canonicalize(b)) {
        (Ok(x), Ok(y)) => x == y,
        _ => a == b,
    }
}

pub fn eval(check: &Check, ctx: &CheckContext) -> Result<bool> {
    let repo = check.repo.as_deref();
    Ok(match &check.kind {
        CheckKind::All { checks } => {
            for c in checks {
                if !eval(&inherit(c, repo), ctx)? {
                    return Ok(false);
                }
            }
            true
        }
        CheckKind::Any { checks } => {
            for c in checks {
                if eval(&inherit(c, repo), ctx).unwrap_or(false) {
                    return Ok(true);
                }
            }
            false
        }
        CheckKind::Not { check } => !eval(&inherit(check, repo), ctx).unwrap_or(false),

        CheckKind::RepoExists { path, bare } => match is_repo_root(&ctx.root.join(path), ctx.env)? {
            None => false,
            Some(is_bare) => bare.is_none_or(|b| b == is_bare),
        },
        CheckKind::PathExists { path } => ctx.root.join(path).exists(),
        CheckKind::PathAbsent { path } => !ctx.root.join(path).exists(),
        CheckKind::Cwd { path } => match ctx.cwd {
            Some(cwd) => same_path(cwd, &ctx.root.join(path)),
            None => false,
        },

        CheckKind::FileContent { path, source, equals, contains, not_contains, matches, lines } => {
            let source = source.as_deref().unwrap_or("worktree");
            let text = if source == "worktree" {
                let base = match repo.or(ctx.default_repo) {
                    Some(r) => ctx.root.join(r),
                    None => ctx.root.to_path_buf(),
                };
                match fs::read_to_string(base.join(path)) {
                    Ok(t) => t,
                    Err(_) => return Ok(false),
                }
            } else {
                let git = ctx.git(repo)?;
                let spec = if source == "index" {
                    format!(":{path}")
                } else {
                    format!("{}:{path}", ctx.expand(source)?)
                };
                match git.try_run(&["show", &spec])? {
                    Some(t) => t,
                    None => return Ok(false),
                }
            };
            if let Some(want) = lines {
                let got: Vec<&str> = text.lines().collect();
                if got != want.iter().map(String::as_str).collect::<Vec<_>>() {
                    return Ok(false);
                }
            }
            text_ok(&text, equals, contains, not_contains, matches)?
        }
        CheckKind::FileInRev { path, rev, present } => {
            let git = ctx.git(repo)?;
            let spec = format!("{}:{path}", ctx.expand(rev)?);
            git.ok(&["cat-file", "-e", &spec])? == *present
        }
        CheckKind::Status { clean, staged, modified, untracked, conflicted, ignored, exact } => {
            let git = ctx.git(repo)?;
            let st = read_status(&git, ignored.is_some())?;
            if let Some(c) = clean {
                let is_clean = st.staged.is_empty() && st.modified.is_empty() && st.untracked.is_empty() && st.conflicted.is_empty();
                if is_clean != *c {
                    return Ok(false);
                }
            }
            let pairs = [
                (staged, &st.staged),
                (modified, &st.modified),
                (untracked, &st.untracked),
                (conflicted, &st.conflicted),
                (ignored, &st.ignored),
            ];
            pairs.iter().all(|(want, got)| want.as_ref().is_none_or(|w| list_ok(w, got, *exact)))
        }
        CheckKind::BranchExists { name, present } => {
            let git = ctx.git(repo)?;
            git.ok(&["show-ref", "--verify", "--quiet", &format!("refs/heads/{name}")])? == *present
        }
        CheckKind::CurrentBranch { name } => {
            let git = ctx.git(repo)?;
            let current = git.try_run(&["symbolic-ref", "--short", "-q", "HEAD"])?.map(|s| s.trim().to_string());
            current == *name
        }
        CheckKind::RefAt { reference, target } => {
            let git = ctx.git(repo)?;
            let a = ctx.resolve(&git, reference)?;
            a.is_some() && a == ctx.resolve(&git, target)?
        }
        CheckKind::RefNotAt { reference, target } => {
            let git = ctx.git(repo)?;
            let a = ctx.resolve(&git, reference)?;
            a.is_some() && a != ctx.resolve(&git, target)?
        }
        CheckKind::IsAncestor { ancestor, descendant } => {
            let git = ctx.git(repo)?;
            let a = ctx.must_resolve(&git, ancestor)?;
            let d = ctx.must_resolve(&git, descendant)?;
            git.ok(&["merge-base", "--is-ancestor", &a, &d])?
        }
        CheckKind::CommitCount { range, equals, min, max } => {
            let git = ctx.git(repo)?;
            let expanded = ctx.expand(range)?;
            let mut args = vec!["rev-list", "--count"];
            args.extend(expanded.split_whitespace());
            let Some(out) = git.try_run(&args)? else { return Ok(false) };
            let n: u64 = out.trim().parse()?;
            equals.is_none_or(|e| n == e) && min.is_none_or(|m| n >= m) && max.is_none_or(|m| n <= m)
        }
        CheckKind::CommitMessage { rev, equals, contains, not_contains, matches } => {
            let git = ctx.git(repo)?;
            let Some(sha) = ctx.resolve(&git, rev)? else { return Ok(false) };
            let msg = git.run(&["log", "-1", "--format=%B", &sha])?;
            text_ok(msg.trim_end(), equals, contains, not_contains, matches)?
        }
        CheckKind::CommitParents { rev, count } => {
            let git = ctx.git(repo)?;
            let Some(sha) = ctx.resolve(&git, rev)? else { return Ok(false) };
            let parents = git.run(&["show", "-s", "--format=%P", &sha])?;
            parents.split_whitespace().count() == *count
        }
        CheckKind::CommitAuthor { rev, name, email } => {
            let git = ctx.git(repo)?;
            let Some(sha) = ctx.resolve(&git, rev)? else { return Ok(false) };
            let out = git.run(&["show", "-s", "--format=%an%x00%ae", &sha])?;
            let (an, ae) = out.trim_end().split_once('\0').unwrap_or(("", ""));
            name.as_deref().is_none_or(|n| n == an) && email.as_deref().is_none_or(|e| e == ae)
        }
        CheckKind::CommitChanges { rev, paths, exact } => {
            let git = ctx.git(repo)?;
            let Some(sha) = ctx.resolve(&git, rev)? else { return Ok(false) };
            let out = git.run(&["diff-tree", "-r", "--root", "--no-commit-id", "--name-only", "--no-renames", &sha])?;
            let changed: Vec<String> = out.lines().map(str::to_string).collect();
            list_ok(paths, &changed, *exact)
        }
        CheckKind::Tag { name, present, annotated, target, message } => {
            let git = ctx.git(repo)?;
            let refname = format!("refs/tags/{name}");
            let exists = git.ok(&["show-ref", "--verify", "--quiet", &refname])?;
            if exists != *present {
                return Ok(false);
            }
            if !exists {
                return Ok(true);
            }
            if let Some(a) = annotated {
                let t = git.run(&["cat-file", "-t", &refname])?;
                if (t.trim() == "tag") != *a {
                    return Ok(false);
                }
            }
            if let Some(t) = target {
                if ctx.resolve(&git, &refname)? != ctx.resolve(&git, t)? {
                    return Ok(false);
                }
            }
            if let Some(m) = message {
                let body = git.run(&["tag", "-l", "--format=%(contents)", name])?;
                if !body.contains(m.as_str()) {
                    return Ok(false);
                }
            }
            true
        }
        CheckKind::Remote { name, url, present } => {
            let git = ctx.git(repo)?;
            match git.try_run(&["remote", "get-url", name])? {
                None => !*present,
                Some(u) => *present && url.as_deref().is_none_or(|want| u.trim().contains(want)),
            }
        }
        CheckKind::Upstream { branch, upstream } => {
            let git = ctx.git(repo)?;
            let got = git
                .try_run(&["rev-parse", "--abbrev-ref", "--symbolic-full-name", &format!("{branch}@{{upstream}}")])?
                .map(|s| s.trim().to_string());
            got == *upstream
        }
        CheckKind::Config { key, value, scope, present } => {
            let git = ctx.git(repo).or_else(|_| -> Result<Git> { Ok(Git::new(ctx.root, ctx.env.clone())) })?;
            let mut args = vec!["config"];
            let flag;
            if let Some(sc) = scope {
                flag = format!("--{sc}");
                args.push(&flag);
            }
            args.extend(["--get", key.as_str()]);
            match git.try_run(&args)? {
                None => !*present,
                Some(v) => *present && value.as_deref().is_none_or(|want| v.trim_end_matches('\n') == want),
            }
        }
        CheckKind::Operation { value } => {
            let git = ctx.git(repo)?;
            let op = current_operation(&git)?;
            op.as_deref() == value.as_deref()
        }
        CheckKind::Stash { count, message_contains } => {
            let git = ctx.git(repo)?;
            let list = git.run(&["stash", "list", "--format=%gs"])?;
            let entries: Vec<&str> = list.lines().collect();
            count.is_none_or(|c| entries.len() == c)
                && message_contains
                    .as_deref()
                    .is_none_or(|m| entries.first().is_some_and(|e| e.contains(m)))
        }
        CheckKind::WorktreeCount { equals } => {
            let git = ctx.git(repo)?;
            let out = git.run(&["worktree", "list", "--porcelain"])?;
            out.lines().filter(|l| l.starts_with("worktree ")).count() == *equals
        }
        CheckKind::Reachable { rev, from } => {
            let git = ctx.git(repo)?;
            let Some(sha) = ctx.resolve(&git, rev)? else { return Ok(false) };
            let refs: Vec<String> = match from {
                Some(list) => list.iter().map(|r| ctx.expand(r)).collect::<Result<_>>()?,
                None => {
                    let mut r: Vec<String> = git
                        .run(&["for-each-ref", "--format=%(refname)", "refs/heads", "refs/tags", "refs/remotes"])?
                        .lines()
                        .map(str::to_string)
                        .collect();
                    r.push("HEAD".into());
                    r
                }
            };
            for r in refs {
                if let Some(tip) = git.resolve_commit(&r)? {
                    if git.ok(&["merge-base", "--is-ancestor", &sha, &tip])? {
                        return Ok(true);
                    }
                }
            }
            false
        }
        CheckKind::UsedCommand { matches, exit_code, last } => {
            let re = Regex::new(matches)?;
            let ok = |c: &&CommandEntry| re.is_match(&c.command) && exit_code.is_none_or(|e| e == c.exit_code);
            if *last {
                ctx.commands.last().as_ref().is_some_and(ok)
            } else {
                ctx.commands.iter().any(|c| ok(&c))
            }
        }
        CheckKind::Answer { question } => {
            let q = ctx
                .questions
                .iter()
                .find(|q| &q.id == question)
                .ok_or_else(|| anyhow!("no question {question}"))?;
            match ctx.answers.get(question) {
                Some(v) => answer_correct(q, v, ctx)?,
                None => false,
            }
        }
        CheckKind::Shell { script } => {
            let dir = ctx.repo_path(repo).unwrap_or_else(|_| ctx.root.to_path_buf());
            std::process::Command::new("bash")
                .args(["-c", script])
                .current_dir(dir)
                .env_clear()
                .envs(ctx.env.iter().map(|(k, v)| (k, v)))
                .env("LESSON_ROOT", ctx.root)
                .stdin(std::process::Stdio::null())
                .output()?
                .status
                .success()
        }
    })
}

/// Children of all/any/not inherit the parent's repo unless they set their own.
fn inherit(child: &Check, parent_repo: Option<&str>) -> Check {
    if child.repo.is_some() || parent_repo.is_none() {
        return child.clone();
    }
    Check { repo: parent_repo.map(str::to_string), kind: child.kind.clone() }
}

/// The in-progress operation, if any: merge, rebase, am, cherry-pick, revert, bisect.
pub fn current_operation(git: &Git) -> Result<Option<String>> {
    // `git am` also uses rebase-apply; it marks itself with an "applying" file.
    if git.git_path("rebase-apply/applying")?.exists() {
        return Ok(Some("am".to_string()));
    }
    let checks = [
        ("rebase-merge", "rebase"),
        ("rebase-apply", "rebase"),
        ("MERGE_HEAD", "merge"),
        ("CHERRY_PICK_HEAD", "cherry-pick"),
        ("REVERT_HEAD", "revert"),
        ("BISECT_LOG", "bisect"),
    ];
    for (file, name) in checks {
        if git.git_path(file)?.exists() {
            return Ok(Some(name.to_string()));
        }
    }
    Ok(None)
}
