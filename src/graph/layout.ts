// Pure graph layout: Snapshot -> nodes, edges, labels with lanes and rows.
// No React, no DOM. The renderer maps (row, lane) to pixels.
// Visual rules: docs/ARCHITECTURE.md section 5.

import type { Commit, RefInfo, Snapshot } from "./types";

export const MAIN = "main";

/** ghost = rewritten original (a copy exists); lost = unreachable with no copy. */
export type NodeKind = "commit" | "merge" | "ghost" | "lost" | "more";

export type GraphNode = {
  id: string;
  row: number;
  lane: number;
  kind: NodeKind;
  /** Branch that owns this commit (first-parent claim), or null. */
  owner: string | null;
  /** Palette slot for the owner; -1 = neutral (main / unowned), -2 = ghost gray. */
  color: number;
  subject: string;
  author: string;
  time: number;
  parents: string[];
  /** How many earlier commits a "more" node stands for. */
  hidden?: number;
  /** For ghosts: the id of the reachable copy that replaced this commit. */
  copy?: string;
};

export type EdgeKind = "first" | "merge" | "ghost" | "lost" | "more" | "copy" | "revert";

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  kind: EdgeKind;
  color: number;
};

export type LabelKind = "branch" | "remote" | "tag" | "head" | "stash" | "bisect";

export type GraphLabel = {
  id: string;
  target: string;
  kind: LabelKind;
  name: string;
  color: number;
  /** For branch labels: HEAD points at this branch. */
  current: boolean;
  annotated: boolean;
};

export type GraphLayout = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  labels: GraphLabel[];
  lanes: number;
  rows: number;
  head: { commit: string | null; branch: string | null; detached: boolean };
};

export type LayoutOptions = {
  /** Rows to show before collapsing older history into one node. */
  maxRows?: number;
  /** Number of palette slots for branch colors. */
  paletteSize?: number;
};

/** FNV-1a 32-bit. */
function fnv1a(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function isTrunk(base: string | null): boolean {
  return base === MAIN || base === "master";
}

/** Local branch name for a ref: `origin/feature` -> `feature`. */
export function baseName(ref: RefInfo): string {
  if (ref.kind !== "remote") return ref.name;
  const i = ref.name.indexOf("/");
  return i >= 0 ? ref.name.slice(i + 1) : ref.name;
}

/**
 * Palette slots for the visible branch names (DESIGN.md 5.2): fnv1a % size,
 * and on a collision the lexicographically later name probes to the next free
 * slot. Trunk gets -1 (neutral).
 */
export function assignColors(names: Iterable<string>, paletteSize: number): Map<string, number> {
  const sorted = [...new Set(names)].sort();
  const taken = new Set<number>();
  const out = new Map<string, number>();
  for (const name of sorted) {
    if (isTrunk(name)) {
      out.set(name, -1);
      continue;
    }
    let slot = fnv1a(name) % paletteSize;
    for (let i = 0; i < paletteSize && taken.has(slot); i++) slot = (slot + 1) % paletteSize;
    taken.add(slot);
    out.set(name, slot);
  }
  return out;
}

/**
 * Owner (local branch name) of each commit: walk first parents from each tip,
 * main first, then other local branches, then remote-tracking branches.
 * First claim wins.
 */
export function owners(commits: Commit[], refs: RefInfo[]): Map<string, string> {
  const byId = new Map(commits.map((c) => [c.id, c]));
  const branches = refs.filter((r) => r.kind === "branch");
  // (bisect refs never own commits)
  const remotes = refs.filter((r) => r.kind === "remote");
  const order = [
    ...branches.filter((b) => isTrunk(b.name)),
    ...branches.filter((b) => !isTrunk(b.name)).sort((a, b) => a.name.localeCompare(b.name)),
    ...remotes.filter((r) => isTrunk(baseName(r))),
    ...remotes.filter((r) => !isTrunk(baseName(r))).sort((a, b) => a.name.localeCompare(b.name)),
  ];
  const owner = new Map<string, string>();
  for (const ref of order) {
    let id: string | undefined = ref.target;
    while (id && byId.has(id) && !owner.has(id)) {
      owner.set(id, baseName(ref));
      id = byId.get(id)!.parents[0];
    }
  }
  return owner;
}

export function layout(snapshot: Snapshot, opts: LayoutOptions = {}): GraphLayout {
  const maxRows = opts.maxRows ?? 200;
  const paletteSize = opts.paletteSize ?? 8;
  const owner = owners(snapshot.commits, snapshot.refs);
  const colors = assignColors(
    snapshot.refs.filter((r) => r.kind === "branch" || r.kind === "remote").map(baseName),
    paletteSize,
  );
  const colorOfName = (name: string | null) => (name === null ? -1 : (colors.get(name) ?? -1));
  const colorOf = (c: Commit) => (c.reachable ? colorOfName(owner.get(c.id) ?? null) : -2);

  // Topological order newest first; ghosts are interleaved by time so they sit
  // near where they used to be.
  const reachable = snapshot.commits.filter((c) => c.reachable);
  const ghosts = snapshot.commits.filter((c) => !c.reachable);
  const ordered = interleave(reachable, ghosts);

  const copies = findCopies(reachable, ghosts);

  const visible = ordered.slice(0, maxRows);
  const hiddenCount = ordered.length - visible.length + (snapshot.truncated ? 1 : 0);
  const visibleIds = new Set(visible.map((c) => c.id));

  // Lane assignment. Lane 0 is reserved for main's first-parent chain so the
  // trunk stays straight.
  const lanes: (string | null)[] = [null];
  const laneOf = new Map<string, number>();
  const mainOwned = (id: string) => isTrunk(owner.get(id) ?? null);
  const freeLane = () => {
    for (let i = 1; i < lanes.length; i++) if (lanes[i] === null) return i;
    lanes.push(null);
    return lanes.length - 1;
  };

  const nodes: GraphNode[] = [];
  visible.forEach((c, row) => {
    let lane: number;
    if (mainOwned(c.id)) {
      lane = 0;
    } else {
      const waiting = lanes.findIndex((x, i) => i > 0 && x === c.id);
      lane = waiting > 0 ? waiting : freeLane();
    }
    // Any other lane waiting for this commit converges here.
    for (let i = 0; i < lanes.length; i++) if (lanes[i] === c.id) lanes[i] = null;

    const first = c.parents[0];
    if (first && visibleIds.has(first)) {
      if (mainOwned(first) && lane !== 0) {
        // Joins the trunk; lane 0 picks it up.
        lanes[lane] = null;
        if (lanes[0] === null) lanes[0] = first;
      } else if (!lanes.includes(first)) {
        lanes[lane] = first;
      } else {
        lanes[lane] = null;
      }
    } else {
      lanes[lane] = null;
    }
    if (lane === 0 && first && mainOwned(first)) lanes[0] = first;
    for (const p of c.parents.slice(1)) {
      if (!visibleIds.has(p) || lanes.includes(p) || mainOwned(p)) continue;
      lanes[freeLane()] = p;
    }

    laneOf.set(c.id, lane);
    nodes.push({
      id: c.id,
      row,
      lane,
      kind: !c.reachable ? (copies.has(c.id) ? "ghost" : "lost") : c.parents.length > 1 ? "merge" : "commit",
      owner: owner.get(c.id) ?? null,
      color: colorOf(c),
      subject: c.subject,
      author: c.author,
      time: c.time,
      parents: c.parents,
      copy: copies.get(c.id),
    });
  });

  const byId = new Map(snapshot.commits.map((c) => [c.id, c]));
  const edges: GraphEdge[] = [];
  let needsMore = false;
  for (const c of visible) {
    c.parents.forEach((p, i) => {
      if (!visibleIds.has(p)) {
        needsMore = true;
        edges.push({ id: `${c.id}-more`, from: c.id, to: "more", kind: "more", color: colorOf(c) });
        return;
      }
      const parent = byId.get(p)!;
      const kind: EdgeKind = !c.reachable ? (copies.has(c.id) ? "ghost" : "lost") : i === 0 ? "first" : "merge";
      // Merge edges take the incoming branch's color; first-parent edges the child's.
      const color = kind === "merge" ? colorOf(parent) : colorOf(c);
      edges.push({ id: `${c.id}-${p}`, from: c.id, to: p, kind, color });
    });
  }

  for (const [orig, copy] of copies) {
    if (visibleIds.has(orig) && visibleIds.has(copy)) {
      edges.push({ id: `copy:${orig}`, from: orig, to: copy, kind: "copy", color: -2 });
    }
  }

  // Revert links: `Revert "<subject>"` points back to the newest older commit
  // with that subject (DESIGN.md 8, "Revert").
  for (const c of visible) {
    const m = /^Revert "(.*)"$/.exec(c.subject);
    if (!m || !c.reachable) continue;
    const target = visible.find((o) => o.subject === m[1] && o.time <= c.time && o.id !== c.id);
    if (target) edges.push({ id: `revert:${c.id}`, from: c.id, to: target.id, kind: "revert", color: -1 });
  }

  if (needsMore || hiddenCount > 0) {
    nodes.push({
      id: "more",
      row: visible.length,
      lane: 0,
      kind: "more",
      owner: null,
      color: -1,
      subject: "",
      author: "",
      time: 0,
      parents: [],
      hidden: Math.max(hiddenCount, 1),
    });
  }
  // Collapse duplicate "more" edges into one per source lane.
  const seen = new Set<string>();
  const dedupedEdges = edges.filter((e) => {
    if (e.kind !== "more") return true;
    const key = `${laneOf.get(e.from)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const labels: GraphLabel[] = [];
  for (const r of snapshot.refs) {
    if (!visibleIds.has(r.target)) continue;
    labels.push({
      id: `${r.kind}:${r.name}:${r.target}`,
      target: r.target,
      kind: r.kind === "remote" ? "remote" : r.kind === "tag" ? "tag" : r.kind === "bisect" ? "bisect" : "branch",
      name: r.name,
      color: r.kind === "tag" || r.kind === "bisect" ? -1 : colorOfName(baseName(r)),
      current: r.kind === "branch" && snapshot.head.branch === r.name,
      annotated: r.annotated,
    });
  }
  for (const s of snapshot.stashes) {
    if (!visibleIds.has(s.base)) continue;
    labels.push({
      id: `stash:${s.index}`,
      target: s.base,
      kind: "stash",
      name: `stash@{${s.index}}`,
      color: -1,
      current: false,
      annotated: false,
    });
  }
  if (snapshot.head.commit && visibleIds.has(snapshot.head.commit)) {
    labels.push({
      id: "HEAD",
      target: snapshot.head.commit,
      kind: "head",
      name: "HEAD",
      color: -1,
      current: true,
      annotated: false,
    });
  }

  const laneCount = Math.max(1, ...nodes.map((n) => n.lane + 1));
  return {
    nodes,
    edges: dedupedEdges,
    labels,
    lanes: laneCount,
    rows: nodes.length,
    head: { commit: snapshot.head.commit, branch: snapshot.head.branch, detached: snapshot.head.detached },
  };
}

/** Merge ghosts into the reachable topo list by commit time, keeping topo order of each. */
function interleave(reachable: Commit[], ghosts: Commit[]): Commit[] {
  if (ghosts.length === 0) return reachable;
  const out: Commit[] = [];
  let g = 0;
  for (const c of reachable) {
    while (g < ghosts.length && ghosts[g].time > c.time) out.push(ghosts[g++]);
    out.push(c);
  }
  while (g < ghosts.length) out.push(ghosts[g++]);
  return out;
}

/**
 * Rewritten originals: an unreachable commit whose subject and author match a
 * reachable commit made later is taken to be replaced by it (amend, rebase,
 * cherry-pick). Cheap stand-in for patch-id matching (lesson 15.17).
 */
function findCopies(reachable: Commit[], ghosts: Commit[]): Map<string, string> {
  const out = new Map<string, string>();
  const used = new Set<string>();
  for (const g of ghosts) {
    const copy = reachable.find((c) => !used.has(c.id) && c.subject === g.subject && c.author === g.author && c.time >= g.time);
    if (copy) {
      out.set(g.id, copy.id);
      used.add(copy.id);
    }
  }
  return out;
}
