import { describe, expect, it } from "vitest";
import { computeGeometry, fitText, PILL_GAP } from "./geometry";
import { layout } from "./layout";
import type { Commit, RefInfo, Snapshot } from "./types";

const measure = (text: string) => text.length * 7;

let t = 1000;
function c(id: string, parents: string[] = []): Commit {
  t -= 10;
  return { id, parents, subject: `commit ${id}`, author: "A", time: t, reachable: true };
}
const br = (name: string, target: string): RefInfo => ({ name, target, kind: "branch", annotated: false });
function snap(commits: Commit[], refs: RefInfo[], head: string, extra: Partial<Snapshot> = {}): Snapshot {
  return {
    bare: false,
    commits,
    truncated: false,
    refs,
    head: { branch: head, commit: refs.find((r) => r.name === head)!.target, detached: false },
    workingTree: { staged: [], modified: [], untracked: [], conflicted: [] },
    operation: null,
    index: [],
    stashes: [],
    worktrees: [],
    reflog: [],
    ...extra,
  };
}

/** Screenshot 3: feature branched off main's tip, HEAD on the feature. */
function branchOff() {
  t = 1000;
  return layout(snap([c("f3", ["f2"]), c("f2", ["f1"]), c("f1", ["m2"]), c("m2", ["m1"]), c("m1")], [br("main", "m2"), br("checkout", "f3")], "checkout"));
}

describe("geometry", () => {
  it("starts and ends every edge at node centres", () => {
    const l = branchOff();
    const g = computeGeometry(l, { showIds: false, measure });
    const byId = new Map(l.nodes.map((n) => [n.id, n]));
    for (const e of l.edges) {
      const d = g.edgePath(e)!;
      const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
      const [p, ch] = [byId.get(e.to)!, byId.get(e.from)!];
      expect(nums.slice(0, 2)).toEqual([g.x(p), g.y(p)]);
      expect(nums.slice(-2)).toEqual([g.x(ch), g.y(ch)]);
    }
  });

  it("puts a branch-off curve in the gap right of the parent", () => {
    const l = branchOff();
    const g = computeGeometry(l, { showIds: false, measure });
    const e = l.edges.find((x) => x.from === "f1")!;
    const m2 = l.nodes.find((n) => n.id === "m2")!;
    const gc = g.x(m2) + g.col / 2;
    expect(g.edgePath(e)).toContain(`C${gc},`);
  });

  it("hangs labels above a commit with children and beside a tip", () => {
    const g = computeGeometry(branchOff(), { showIds: false, measure });
    expect(g.rows.get("m2")!.placement).toBe("above");
    expect(g.rows.get("f3")!.placement).toBe("beside");
    expect(g.rows.get("f3")!.pills[0].text).toBe("HEAD → checkout");
  });

  it("keeps an above-row clear of the curve leaving its commit", () => {
    const l = branchOff();
    const g = computeGeometry(l, { showIds: false, measure });
    const m2 = l.nodes.find((n) => n.id === "m2")!;
    const row = g.rows.get("m2")!;
    // m2's lane band is crossed by the S in the gap to its right.
    expect(g.x(m2) + row.left + row.width).toBeLessThanOrEqual(g.x(m2) + g.col / 2 - g.s / 2 - 4 + 0.001);
  });

  it("puts other worktrees on the branch pills, in one row", () => {
    t = 1000;
    const l = layout(snap([c("a")], [br("main", "a"), br("review", "a"), br("scratch", "a")], "main"));
    const others = [
      { name: "review", head: "a", branch: "review" },
      { name: "scratch", head: "a", branch: "scratch" },
    ];
    const g = computeGeometry(l, { showIds: false, others, measure });
    const row = g.rows.get("a")!;
    expect(row.pills.map((p) => p.text)).toEqual(["HEAD → main", "review", "scratch"]);
    expect(row.pills[1].worktrees).toEqual(["review"]);
    expect(row.width).toBe(row.pills.reduce((a, p) => a + p.width, 0) + 2 * PILL_GAP);
  });

  it("collapses crowded above-rows instead of overlapping a neighbour", () => {
    t = 1000;
    const refs = [br("main", "c3"), br("alpha-long-name", "c2"), br("beta-long-name", "c2"), br("gamma", "c1"), br("delta-long", "c1")];
    const l = layout(snap([c("c3", ["c2"]), c("c2", ["c1"]), c("c1")], refs, "main"));
    const g = computeGeometry(l, { showIds: true, measure });
    const r1 = g.rows.get("c1")!;
    const r2 = g.rows.get("c2")!;
    const x = (id: string) => g.x(l.nodes.find((n) => n.id === id)!);
    expect(x("c1") + r1.left + r1.width).toBeLessThan(x("c2") + r2.left);
    expect(r2.pills[r2.pills.length - 1].kind).toBe("more");
  });

  it("truncates subjects by width", () => {
    expect(fitText("Fix price rounding for totals", 104, measure, "sans")).toMatch(/…$/);
    expect(fitText("Add cart", 104, measure, "sans")).toBe("Add cart");
  });
});
