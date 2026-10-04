// Pure geometry for the graph (docs/design/GRAPH_SPEC.md): node positions,
// edge paths, label rows and subject text. No DOM: text widths come from a
// `measure` function so tests can pass a fake one.

import type { GraphEdge, GraphLabel, GraphLayout, GraphNode } from "./layout";

export const R = 6;
export const HALO_R = 11;
export const SEL_R = 10;
export const PILL_H = 20;
export const PILL_PAD = 8;
export const PILL_GAP = 6;
export const STUB = 8;
export const SUBJECT_Y = 24;
const LANE = 68;
const PAD_BOTTOM = 36;
const ABOVE_TOP = -34; // pill box of an above-row: y-34 .. y-14
const MIN_NAME = 8;

export type Font = "mono" | "sans";
export type Measure = (text: string, weight: number, font: Font) => number;

export type PillKind = "branch" | "head" | "detached" | "remote" | "tag" | "bisect" | "more" | "worktreeHead";

export type Pill = {
  kind: PillKind;
  /** Text as drawn (may be truncated). */
  text: string;
  /** Full text for tooltips. */
  full: string;
  width: number;
  color: number;
  annotated?: boolean;
  /** Branch checked out in another worktree: folder names. */
  worktrees?: string[];
  /** For +N: the hidden names. */
  hidden?: string[];
};

export type Row = { pills: Pill[]; placement: "beside" | "above"; left: number; width: number };

export type Geometry = {
  col: number;
  s: number;
  width: number;
  height: number;
  padTop: number;
  x: (n: GraphNode) => number;
  y: (n: GraphNode) => number;
  rows: Map<string, Row>;
  subjects: Map<string, string>;
  edgePath: (e: GraphEdge) => string | null;
};

export type OtherWorktree = { name: string; head: string | null; branch: string | null };

const pillWidth = (text: string, kind: PillKind, measure: Measure) => {
  const w = measure(text, kind === "tag" || kind === "bisect" ? 500 : 600, "mono");
  const extra = kind === "tag" ? 14 : kind === "worktreeHead" ? 12 : 0;
  return Math.ceil(w + PILL_PAD * 2 + extra);
};

function withWorktreeGlyph(p: Pill): Pill {
  return { ...p, width: p.width + 13 };
}

/** The pills on each commit, in the spec's order (section 5). */
export function pillsByCommit(layout: GraphLayout, others: OtherWorktree[], measure: Measure): Map<string, Pill[]> {
  const groups = new Map<string, GraphLabel[]>();
  for (const l of layout.labels) {
    if (l.kind === "stash" || l.kind === "head") continue;
    groups.set(l.target, [...(groups.get(l.target) ?? []), l]);
  }
  const out = new Map<string, Pill[]>();
  const base = (n: string) => n.slice(n.indexOf("/") + 1);
  const make = (kind: PillKind, text: string, color: number, extra: Partial<Pill> = {}): Pill => ({
    kind,
    text,
    full: text,
    width: pillWidth(text, kind, measure),
    color,
    ...extra,
  });
  const targets = new Set([...groups.keys(), ...(layout.head.detached && layout.head.commit ? [layout.head.commit] : []), ...others.filter((o) => !o.branch && o.head).map((o) => o.head!)]);
  for (const target of targets) {
    const labels = groups.get(target) ?? [];
    const pills: Pill[] = [];
    if (layout.head.detached && layout.head.commit === target) pills.push(make("detached", "HEAD", -1));
    for (const o of others) if (!o.branch && o.head === target) pills.push(withWorktreeGlyph(make("worktreeHead", "HEAD", -1, { worktrees: [o.name] })));
    const branches = labels.filter((l) => l.kind === "branch").sort((a, b) => Number(b.current) - Number(a.current) || a.name.localeCompare(b.name));
    const remotes = labels.filter((l) => l.kind === "remote");
    const usedRemotes = new Set<GraphLabel>();
    for (const b of branches) {
      const wts = others.filter((o) => o.branch === b.name).map((o) => o.name);
      let p = b.current ? make("head", `HEAD → ${b.name}`, b.color) : make("branch", b.name, b.color);
      if (wts.length > 0) p = withWorktreeGlyph({ ...p, worktrees: wts });
      pills.push(p);
      for (const r of remotes.filter((r) => base(r.name) === b.name).sort((a, c) => a.name.localeCompare(c.name))) {
        pills.push(make("remote", r.name, r.color));
        usedRemotes.add(r);
      }
    }
    for (const r of remotes.filter((r) => !usedRemotes.has(r)).sort((a, c) => a.name.localeCompare(c.name))) pills.push(make("remote", r.name, r.color));
    for (const t of labels.filter((l) => l.kind === "tag").sort((a, c) => a.name.localeCompare(c.name))) pills.push(make("tag", t.name, -1, { annotated: t.annotated }));
    for (const b of labels.filter((l) => l.kind === "bisect")) pills.push(make("bisect", b.name, -1));
    if (pills.length > 0) out.set(target, pills);
  }
  return out;
}

const rowWidth = (pills: Pill[]) => pills.reduce((a, p) => a + p.width, 0) + PILL_GAP * Math.max(0, pills.length - 1);

/** Cut a pill's name to `width`, keeping at least MIN_NAME characters. */
function truncatePill(p: Pill, width: number, measure: Measure): Pill {
  const prefix = p.kind === "head" ? "HEAD → " : "";
  const name = p.text.slice(prefix.length);
  let n = name.length;
  let q = p;
  while (q.width > width && n > MIN_NAME) {
    n--;
    const text = `${prefix}${name.slice(0, n)}…`;
    q = { ...p, text, width: pillWidth(text, p.kind, measure) + (p.worktrees ? 13 : 0) };
  }
  return q;
}

/** Cut text to fit `max` px with an ellipsis. */
export function fitText(text: string, max: number, measure: Measure, font: Font, weight = 400): string {
  if (measure(text, weight, font) <= max) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (measure(`${text.slice(0, mid).trimEnd()}…`, weight, font) <= max) lo = mid;
    else hi = mid - 1;
  }
  return `${text.slice(0, lo).trimEnd()}…`;
}

export function computeGeometry(layout: GraphLayout, opts: { showIds: boolean; others?: OtherWorktree[]; measure: Measure }): Geometry {
  const { showIds, measure } = opts;
  const col = showIds ? 64 : 120;
  const s = showIds ? 22 : 40;
  const nodes = layout.nodes;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const maxRow = Math.max(0, ...nodes.map((n) => n.row));
  const more = nodes.find((n) => n.kind === "more");
  const moreW = more ? measure(moreText(more), 400, "mono") + 16 : 0;
  const padLeft = Math.max(col / 2 + 8, moreW / 2 + 12);
  const xOf = (n: GraphNode) => padLeft + (maxRow - n.row) * col;

  // Which column gaps hold an S-curve, and between which lanes. Gap g sits
  // between column g and g+1 (columns counted from the left).
  const colOf = (n: GraphNode) => maxRow - n.row;
  type S = { gap: number; lo: number; hi: number };
  const curves: S[] = [];
  const sOf = new Map<string, number>();
  for (const e of layout.edges) {
    if (e.kind === "copy" || e.kind === "revert") continue;
    const child = byId.get(e.from);
    const parent = byId.get(e.to);
    if (!child || !parent || child.lane === parent.lane) continue;
    const gap = e.kind === "merge" ? colOf(child) - 1 : colOf(parent);
    sOf.set(e.id, gap);
    curves.push({ gap, lo: Math.min(child.lane, parent.lane), hi: Math.max(child.lane, parent.lane) });
  }
  const gapBusy = (gap: number, lane: number) => curves.some((c) => c.gap === gap && c.lo <= lane && lane < c.hi);

  // A commit with children keeps its labels above; a tip has them beside.
  const hasChild = new Set<string>();
  for (const e of layout.edges) if (e.kind !== "copy" && e.kind !== "revert" && byId.has(e.from)) hasChild.add(e.to);

  const pills = pillsByCommit(layout, opts.others ?? [], measure);
  const rows = new Map<string, Row>();
  const byLane = new Map<number, GraphNode[]>();
  for (const n of nodes) byLane.set(n.lane, [...(byLane.get(n.lane) ?? []), n]);
  for (const laneNodes of byLane.values()) {
    laneNodes.sort((a, b) => xOf(a) - xOf(b));
    let prevRight: number | null = null;
    laneNodes.forEach((n, i) => {
      const list = pills.get(n.id);
      const x = xOf(n);
      if (!list) {
        prevRight = null;
        return;
      }
      if (!hasChild.has(n.id)) {
        rows.set(n.id, { pills: list, placement: "beside", left: R + 1 + STUB, width: rowWidth(list) });
        prevRight = null;
        return;
      }
      // Allowed span (spec 5.2).
      let left = x - col / 2 - 12;
      let right = x + col / 2 + 12;
      const c = colOf(n);
      if (gapBusy(c, n.lane)) right = Math.min(right, x + col / 2 - s / 2 - 4);
      if (gapBusy(c - 1, n.lane)) left = Math.max(left, x - col / 2 + s / 2 + 4);
      const prev = laneNodes[i - 1];
      if (prev) left = Math.max(left, prevRight !== null ? prevRight + PILL_GAP : xOf(prev) + 16);
      const next = laneNodes[i + 1];
      if (next) right = Math.min(right, xOf(next) - 16);
      const room = right - left;
      let shown = list;
      if (rowWidth(shown) > room && shown.length > 1) {
        const hidden = shown.slice(1).map((p) => p.full);
        const label = `+${hidden.length}`;
        shown = [shown[0], { kind: "more", text: label, full: label, width: pillWidth(label, "more", measure), color: -1, hidden }];
      }
      if (rowWidth(shown) > room) {
        const others = rowWidth(shown) - shown[0].width;
        shown = [truncatePill(shown[0], room - others, measure), ...shown.slice(1)];
      }
      const w = rowWidth(shown);
      // Centre on the commit, then keep inside the span; a row that is still
      // too wide overflows to the right, never into the left neighbour.
      let at = x - w / 2;
      at = Math.min(at, right - w);
      at = Math.max(at, left);
      rows.set(n.id, { pills: shown, placement: "above", left: at - x, width: w });
      prevRight = at + w;
    });
  }

  const subjects = new Map<string, string>();
  for (const n of nodes) {
    if (n.kind === "more") continue;
    subjects.set(n.id, showIds ? n.id.slice(0, 7) : fitText(n.subject, col - 16, measure, "sans"));
  }

  const lanes = Math.max(layout.lanes, 1);
  const topAbove = nodes.some((n) => n.lane === lanes - 1 && rows.get(n.id)?.placement === "above");
  const topRevert = layout.edges.some((e) => e.kind === "revert" && byId.get(e.from)?.lane === lanes - 1);
  const padTop = topRevert ? 64 : topAbove ? 44 : 22;
  const yOf = (n: GraphNode) => padTop + (lanes - 1 - n.lane) * LANE;

  let width = padLeft + maxRow * col + col / 2 + 8;
  for (const n of nodes) {
    const r = rows.get(n.id);
    if (r) width = Math.max(width, xOf(n) + r.left + r.width + 24);
  }

  const edgePath = (e: GraphEdge): string | null => {
    const child = byId.get(e.from);
    const parent = byId.get(e.to);
    if (!child || !parent) return null;
    const xp = xOf(parent);
    const yp = yOf(parent);
    const xc = xOf(child);
    const yc = yOf(child);
    if (yp === yc) return `M${xp},${yp} L${xc},${yc}`;
    const gap = sOf.get(e.id) ?? colOf(parent);
    const gc = padLeft + gap * col + col / 2;
    return `M${xp},${yp} L${gc - s / 2},${yp} C${gc},${yp} ${gc},${yc} ${gc + s / 2},${yc} L${xc},${yc}`;
  };

  return {
    col,
    s,
    width,
    height: padTop + (lanes - 1) * LANE + PAD_BOTTOM,
    padTop,
    x: xOf,
    y: yOf,
    rows,
    subjects,
    edgePath,
  };
}

export const moreText = (n: GraphNode) => `${n.hidden} earlier ${n.hidden === 1 ? "commit" : "commits"}`;

export const ABOVE_Y = ABOVE_TOP;
