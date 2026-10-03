import { describe, expect, it } from "vitest";
import { assignColors, layout, owners } from "./layout";
import type { Commit, RefInfo, Snapshot } from "./types";

let t = 1000;
function c(id: string, parents: string[] = [], reachable = true): Commit {
  t -= 10;
  return { id, parents, subject: `commit ${id}`, author: "A", time: t, reachable };
}

function snap(commits: Commit[], refs: RefInfo[], head: string | null = "main", extra: Partial<Snapshot> = {}): Snapshot {
  const branch = refs.find((r) => r.kind === "branch" && r.name === head);
  return {
    bare: false,
    commits,
    truncated: false,
    refs,
    head: { branch: branch ? head : null, commit: branch ? branch.target : head, detached: !branch },
    workingTree: { staged: [], modified: [], untracked: [], conflicted: [] },
    operation: null,
    index: [],
    stashes: [],
    worktrees: [],
    reflog: [],
    ...extra,
  };
}

const br = (name: string, target: string): RefInfo => ({ name, target, kind: "branch", annotated: false });

// Topo order newest first:  m3 (merge of m2 + f2), f2, f1, m2, m1
//   m1 - m2 ------- m3   (main)
//          \- f1 - f2 /  (feature)
function diverged() {
  t = 1000;
  const commits = [c("m3", ["m2", "f2"]), c("f2", ["f1"]), c("f1", ["m1"]), c("m2", ["m1"]), c("m1")];
  return snap(commits, [br("main", "m3"), br("feature", "f2")]);
}

describe("owners", () => {
  it("lets main claim its first-parent chain first", () => {
    const s = diverged();
    const o = owners(s.commits, s.refs);
    expect(o.get("m3")).toBe("main");
    expect(o.get("m2")).toBe("main");
    expect(o.get("m1")).toBe("main");
    expect(o.get("f2")).toBe("feature");
    expect(o.get("f1")).toBe("feature");
  });

  it("maps remote-tracking branches to their local name", () => {
    t = 1000;
    const commits = [c("b", ["a"]), c("a")];
    const o = owners(commits, [br("main", "a"), { name: "origin/main", target: "b", kind: "remote", annotated: false }]);
    expect(o.get("b")).toBe("main");
  });
});

describe("assignColors", () => {
  it("gives main the neutral slot and distinct slots to others", () => {
    const names = ["main", "a", "b", "c", "d", "e", "f", "g", "h"];
    const colors = assignColors(names, 8);
    expect(colors.get("main")).toBe(-1);
    const slots = names.filter((n) => n !== "main").map((n) => colors.get(n));
    expect(new Set(slots).size).toBe(8);
  });

  it("is stable for the same set of names", () => {
    expect(assignColors(["x", "y"], 8)).toEqual(assignColors(["y", "x"], 8));
  });
});

describe("layout", () => {
  it("keeps main on lane 0 and puts the feature on another lane", () => {
    const l = layout(diverged());
    const lane = (id: string) => l.nodes.find((n) => n.id === id)!.lane;
    expect(lane("m1")).toBe(0);
    expect(lane("m2")).toBe(0);
    expect(lane("m3")).toBe(0);
    expect(lane("f1")).toBe(1);
    expect(lane("f2")).toBe(1);
    expect(l.lanes).toBe(2);
  });

  it("marks merges and colors the merge edge with the source branch", () => {
    const l = layout(diverged());
    expect(l.nodes.find((n) => n.id === "m3")!.kind).toBe("merge");
    const mergeEdge = l.edges.find((e) => e.from === "m3" && e.to === "f2")!;
    const featureColor = l.nodes.find((n) => n.id === "f2")!.color;
    expect(mergeEdge.kind).toBe("merge");
    expect(mergeEdge.color).toBe(featureColor);
    expect(l.edges.find((e) => e.from === "m3" && e.to === "m2")!.color).toBe(-1);
  });

  it("labels branches, current branch and HEAD", () => {
    const l = layout(diverged());
    const main = l.labels.find((x) => x.kind === "branch" && x.name === "main")!;
    expect(main.current).toBe(true);
    expect(l.labels.find((x) => x.kind === "branch" && x.name === "feature")!.current).toBe(false);
    expect(l.labels.find((x) => x.kind === "head")!.target).toBe("m3");
  });

  it("draws reflog-only commits as lost, or as ghosts when a copy exists", () => {
    t = 1000;
    const commits = [c("new", ["base"]), c("old", ["base"], false), c("base")];
    const l = layout(snap(commits, [br("main", "new")]));
    const lost = l.nodes.find((n) => n.id === "old")!;
    expect(lost.kind).toBe("lost");
    expect(lost.color).toBe(-2);
    expect(l.edges.find((e) => e.from === "old")!.kind).toBe("lost");

    t = 1000;
    const copy = { ...c("copy", ["base2"]), subject: "same" };
    const orig = { ...c("orig", ["base"], false), subject: "same" };
    copy.time = 2000;
    const l2 = layout(snap([copy, orig, c("base2", ["base"]), c("base")], [br("main", "copy")]));
    expect(l2.nodes.find((n) => n.id === "orig")!.kind).toBe("ghost");
    expect(l2.nodes.find((n) => n.id === "orig")!.copy).toBe("copy");
    expect(l2.edges.some((e) => e.kind === "copy" && e.from === "orig" && e.to === "copy")).toBe(true);
  });

  it("collapses history beyond maxRows into one node", () => {
    t = 1000;
    const commits: Commit[] = [];
    for (let i = 9; i >= 0; i--) commits.push(c(`c${i}`, i > 0 ? [`c${i - 1}`] : []));
    const l = layout(snap(commits, [br("main", "c9")]), { maxRows: 4 });
    const more = l.nodes.find((n) => n.kind === "more")!;
    expect(more.hidden).toBe(6);
    expect(l.nodes.filter((n) => n.kind !== "more")).toHaveLength(4);
    expect(l.edges.filter((e) => e.kind === "more")).toHaveLength(1);
  });

  it("handles detached HEAD and an empty repo", () => {
    t = 1000;
    const commits = [c("b", ["a"]), c("a")];
    const l = layout(snap(commits, [br("main", "b")], "a"));
    expect(l.head.detached).toBe(true);
    expect(l.labels.find((x) => x.kind === "head")!.target).toBe("a");
    const empty = layout(snap([], [], null));
    expect(empty.nodes).toHaveLength(0);
  });

  it("links a revert commit to the commit it undoes", () => {
    t = 1000;
    const commits = [{ ...c("r", ["b"]), subject: 'Revert "Add b"' }, { ...c("b", ["a"]), subject: "Add b" }, c("a")];
    const l = layout(snap(commits, [br("main", "r")]));
    expect(l.edges.find((e) => e.kind === "revert")).toMatchObject({ from: "r", to: "b" });
  });

  it("puts stashes on their base commit", () => {
    t = 1000;
    const commits = [c("a")];
    const l = layout(snap(commits, [br("main", "a")], "main", { stashes: [{ index: 0, id: "s", message: "WIP", base: "a" }] }));
    expect(l.labels.find((x) => x.kind === "stash")!.target).toBe("a");
  });
});
