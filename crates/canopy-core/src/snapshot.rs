//! Read-only snapshot of a repo for the graph and panels
//! (docs/ARCHITECTURE.md section 4.2).

use std::collections::HashSet;

use anyhow::Result;
use serde::Serialize;

use crate::check::{current_operation, read_status};
use crate::git::Git;

/// Commits beyond this many are collapsed by the graph; we don't read them.
const MAX_COMMITS: usize = 400;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Commit {
    pub id: String,
    pub parents: Vec<String>,
    pub subject: String,
    pub author: String,
    pub time: i64,
    /// False for commits only found in the reflog (lost, rewritten originals).
    pub reachable: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RefInfo {
    pub name: String,
    pub target: String,
    pub kind: RefKind,
    /// Annotated tags: true. Lets the graph draw them differently.
    pub annotated: bool,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RefKind {
    Branch,
    Tag,
    Remote,
    /// refs/bisect/bad, good-*, skip-* (or custom terms) during a bisect.
    Bisect,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Head {
    pub branch: Option<String>,
    pub commit: Option<String>,
    pub detached: bool,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkingTree {
    pub staged: Vec<String>,
    pub modified: Vec<String>,
    pub untracked: Vec<String>,
    pub conflicted: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexEntry {
    pub path: String,
    pub blob: String,
    pub stage: u8,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StashEntry {
    pub index: usize,
    pub id: String,
    pub message: String,
    pub base: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Worktree {
    pub path: String,
    pub head: Option<String>,
    pub branch: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReflogEntry {
    pub id: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub bare: bool,
    pub commits: Vec<Commit>,
    /// True when history was cut at MAX_COMMITS.
    pub truncated: bool,
    pub refs: Vec<RefInfo>,
    pub head: Head,
    pub working_tree: WorkingTree,
    pub operation: Option<String>,
    pub index: Vec<IndexEntry>,
    pub stashes: Vec<StashEntry>,
    pub worktrees: Vec<Worktree>,
    pub reflog: Vec<ReflogEntry>,
}

pub fn take(git: &Git) -> Result<Snapshot> {
    let bare = git.run(&["rev-parse", "--is-bare-repository"])?.trim() == "true";

    let branch = git.try_run(&["symbolic-ref", "--short", "-q", "HEAD"])?.map(|s| s.trim().to_string());
    let head_commit = git.resolve_commit("HEAD")?;
    let head = Head { detached: branch.is_none() && head_commit.is_some(), branch, commit: head_commit.clone() };

    let refs = read_refs(git)?;

    // Reachable history from branches, tags, remotes and HEAD (not stashes).
    let mut tips: Vec<String> = refs.iter().map(|r| r.target.clone()).collect();
    tips.extend(head_commit.clone());
    tips.sort();
    tips.dedup();
    let mut commits = Vec::new();
    let mut truncated = false;
    if !tips.is_empty() {
        let max = format!("--max-count={}", MAX_COMMITS + 1);
        let mut args = vec!["log", "--topo-order", "--format=%H%x00%P%x00%s%x00%an%x00%at", max.as_str()];
        args.extend(tips.iter().map(String::as_str));
        args.push("--");
        commits = parse_log(&git.run(&args)?, true);
        if commits.len() > MAX_COMMITS {
            commits.truncate(MAX_COMMITS);
            truncated = true;
        }
    }

    // Reflog-only commits (rewritten originals, lost work) as ghosts.
    let reflog = read_reflog(git)?;
    let known: HashSet<String> = commits.iter().map(|c| c.id.clone()).collect();
    let lost: Vec<&str> = reflog
        .iter()
        .map(|r| r.id.as_str())
        .filter(|id| !known.contains(*id))
        .collect::<HashSet<_>>()
        .into_iter()
        .collect();
    if !lost.is_empty() && !truncated {
        let mut args = vec!["log", "--topo-order", "--format=%H%x00%P%x00%s%x00%an%x00%at", "--max-count=200"];
        args.extend(lost.iter().copied());
        args.push("--not");
        args.extend(tips.iter().map(String::as_str));
        args.push("--");
        if let Some(out) = git.try_run(&args)? {
            commits.extend(parse_log(&out, false));
        }
    }

    let (working_tree, index, operation, stashes) = if bare {
        (WorkingTree::default(), Vec::new(), None, Vec::new())
    } else {
        let st = read_status(git, false)?;
        let wt = WorkingTree { staged: st.staged, modified: st.modified, untracked: st.untracked, conflicted: st.conflicted };
        (wt, read_index(git)?, current_operation(git)?, read_stashes(git)?)
    };

    Ok(Snapshot {
        bare,
        commits,
        truncated,
        refs,
        head,
        working_tree,
        operation,
        index,
        stashes,
        worktrees: read_worktrees(git)?,
        reflog,
    })
}

fn parse_log(out: &str, reachable: bool) -> Vec<Commit> {
    out.lines()
        .filter_map(|line| {
            let mut f = line.split('\0');
            Some(Commit {
                id: f.next()?.to_string(),
                parents: f.next()?.split_whitespace().map(str::to_string).collect(),
                subject: f.next()?.to_string(),
                author: f.next()?.to_string(),
                time: f.next()?.parse().unwrap_or(0),
                reachable,
            })
        })
        .collect()
}

fn read_refs(git: &Git) -> Result<Vec<RefInfo>> {
    let full = git.try_run(&[
        "for-each-ref",
        "--format=%(refname)%00%(objectname)%00%(*objectname)%00%(objecttype)",
        "refs/heads",
        "refs/tags",
        "refs/remotes",
        "refs/bisect",
    ])?;
    // A ref pointing at a missing object (section 10/14 lessons break refs on
    // purpose) makes the format above fail; fall back to names and ids only,
    // keeping refs whose target still resolves to a commit.
    let out = match full {
        Some(out) => out,
        None => {
            let basic = git.run(&["for-each-ref", "--format=%(refname)%00%(objectname)%00%00commit", "refs/heads", "refs/tags", "refs/remotes", "refs/bisect"])?;
            basic
                .lines()
                .filter(|l| {
                    let id = l.split('\0').nth(1).unwrap_or("");
                    git.resolve_commit(id).ok().flatten().is_some()
                })
                .map(|l| format!("{l}\n"))
                .collect()
        }
    };
    let mut refs = Vec::new();
    for line in out.lines() {
        let f: Vec<&str> = line.split('\0').collect();
        if f.len() < 4 {
            continue;
        }
        let (full, obj, peeled, ty) = (f[0], f[1], f[2], f[3]);
        let (kind, name) = if let Some(n) = full.strip_prefix("refs/heads/") {
            (RefKind::Branch, n)
        } else if let Some(n) = full.strip_prefix("refs/tags/") {
            (RefKind::Tag, n)
        } else if let Some(n) = full.strip_prefix("refs/bisect/") {
            // good-<id> / skip-<id> / bad (or custom terms): keep the term only.
            (RefKind::Bisect, n.split('-').next().unwrap_or(n))
        } else if let Some(n) = full.strip_prefix("refs/remotes/") {
            if n.ends_with("/HEAD") {
                continue;
            }
            (RefKind::Remote, n)
        } else {
            continue;
        };
        let annotated = ty == "tag";
        let target = if annotated { peeled } else { obj };
        if annotated && peeled.is_empty() {
            continue; // tag of a non-commit
        }
        refs.push(RefInfo { name: name.to_string(), target: target.to_string(), kind, annotated });
    }
    Ok(refs)
}

fn read_index(git: &Git) -> Result<Vec<IndexEntry>> {
    let out = git.run(&["ls-files", "-s", "-z"])?;
    Ok(out
        .split('\0')
        .filter_map(|e| {
            let (meta, path) = e.split_once('\t')?;
            let mut m = meta.split_whitespace();
            let _mode = m.next()?;
            Some(IndexEntry { blob: m.next()?.to_string(), stage: m.next()?.parse().ok()?, path: path.to_string() })
        })
        .collect())
}

fn read_stashes(git: &Git) -> Result<Vec<StashEntry>> {
    let Some(out) = git.try_run(&["stash", "list", "--format=%H%x00%gs%x00%P"])? else {
        return Ok(Vec::new());
    };
    Ok(out
        .lines()
        .enumerate()
        .filter_map(|(i, l)| {
            let mut f = l.split('\0');
            let id = f.next()?.to_string();
            let message = f.next()?.to_string();
            let base = f.next()?.split_whitespace().next()?.to_string();
            Some(StashEntry { index: i, id, message, base })
        })
        .collect())
}

fn read_worktrees(git: &Git) -> Result<Vec<Worktree>> {
    let Some(out) = git.try_run(&["worktree", "list", "--porcelain"])? else {
        return Ok(Vec::new());
    };
    let mut list = Vec::new();
    for block in out.split("\n\n") {
        let mut wt = Worktree { path: String::new(), head: None, branch: None };
        for line in block.lines() {
            if let Some(p) = line.strip_prefix("worktree ") {
                wt.path = p.to_string();
            } else if let Some(h) = line.strip_prefix("HEAD ") {
                wt.head = Some(h.to_string());
            } else if let Some(b) = line.strip_prefix("branch ") {
                wt.branch = Some(b.trim_start_matches("refs/heads/").to_string());
            }
        }
        if !wt.path.is_empty() {
            list.push(wt);
        }
    }
    Ok(list)
}

fn read_reflog(git: &Git) -> Result<Vec<ReflogEntry>> {
    let Some(out) = git.try_run(&["reflog", "show", "--format=%H%x00%gs", "-n", "50", "HEAD", "--"])? else {
        return Ok(Vec::new());
    };
    Ok(out
        .lines()
        .filter_map(|l| {
            let (id, msg) = l.split_once('\0')?;
            Some(ReflogEntry { id: id.to_string(), message: msg.to_string() })
        })
        .collect())
}
