// Mirrors canopy_core::snapshot (Rust). Keep in sync with snapshot.rs.

export type Commit = {
  id: string;
  parents: string[];
  subject: string;
  author: string;
  time: number;
  /** False for commits only found in the reflog (lost or rewritten originals). */
  reachable: boolean;
};

export type RefKind = "branch" | "tag" | "remote" | "bisect";

export type RefInfo = {
  name: string;
  target: string;
  kind: RefKind;
  annotated: boolean;
};

export type Head = {
  branch: string | null;
  commit: string | null;
  detached: boolean;
};

export type WorkingTree = {
  staged: string[];
  modified: string[];
  untracked: string[];
  conflicted: string[];
};

export type IndexEntry = { path: string; blob: string; stage: number };
export type StashEntry = { index: number; id: string; message: string; base: string };
export type Worktree = { path: string; head: string | null; branch: string | null };
export type ReflogEntry = { id: string; message: string };

export type Snapshot = {
  bare: boolean;
  commits: Commit[];
  truncated: boolean;
  refs: RefInfo[];
  head: Head;
  workingTree: WorkingTree;
  operation: null | "merge" | "rebase" | "am" | "cherry-pick" | "revert" | "bisect";
  index: IndexEntry[];
  stashes: StashEntry[];
  worktrees: Worktree[];
  reflog: ReflogEntry[];
};
