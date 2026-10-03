// Thin SVG renderer for a GraphLayout (DESIGN.md section 8).
// Horizontal: time flows left -> right, newest on the right, main on the
// bottom lane. Only transform and opacity animate.

import { CircleDashed } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { GraphEdge, GraphLabel, GraphLayout, GraphNode } from "./layout";
import "./graph.css";

const COL_IDS = 58; // commit spacing when nodes show 7-char ids
const COL_SUBJECTS = 112; // commit spacing when nodes show (truncated) subjects
const SUBJECT_CHARS = 18;
const R = 6;
const PILL_H = 20;
const PILL_GAP = 6;
const STUB = 8; // connector from the node edge to the first pill

/** Geometry scaled by the Text size setting (1 = Default). */
type Dims = { col: number; lane: number; padX: number; padTop: number; padBottom: number; scale: number };

function dims(showIds: boolean, scale: number): Dims {
  const col = (showIds ? COL_IDS : COL_SUBJECTS) * scale;
  return { col, lane: 64 * scale, padX: showIds ? 32 * scale : col / 2 + 4, padTop: 48 * scale, padBottom: 36 * scale, scale };
}

/** Height the graph needs (the pane sizes itself to this). */
export function graphHeight(l: GraphLayout, showIds: boolean, scale: number): number {
  const d = dims(showIds, scale);
  return d.padTop + (Math.max(l.lanes, 1) - 1) * d.lane + d.padBottom;
}

export type Geometry = {
  width: number;
  height: number;
  d: Dims;
  x: (n: GraphNode) => number;
  y: (n: GraphNode) => number;
};

function geometry(l: GraphLayout, labelRoom: number, d: Dims): Geometry {
  const maxRow = Math.max(0, ...l.nodes.map((n) => n.row));
  return {
    width: d.padX * 2 + maxRow * d.col + labelRoom,
    height: d.padTop + (l.lanes - 1) * d.lane + d.padBottom,
    d,
    x: (n) => d.padX + (maxRow - n.row) * d.col,
    y: (n) => d.padTop + (l.lanes - 1 - n.lane) * d.lane,
  };
}

// Pill text widths from the real font, so pills fit at every text size.
let measureCtx: CanvasRenderingContext2D | null = null;
function textWidth(text: string, scale: number, weight = 600): number {
  measureCtx ??= document.createElement("canvas").getContext("2d");
  if (!measureCtx) return text.length * 6.7 * scale;
  measureCtx.font = `${weight} ${11 * scale}px "JetBrains Mono Variable", "JetBrains Mono", monospace`;
  return measureCtx.measureText(text).width;
}

/** A label as drawn: the text shown and its pill width. */
type Pill = { label: GraphLabel; text: string; width: number; head?: boolean };

function pillFor(label: GraphLabel, scale: number, headOnBranch: boolean): Pill {
  const text = headOnBranch ? `HEAD → ${label.name}` : label.name;
  const extra = label.kind === "tag" ? (label.annotated ? 16 : 8) : 0;
  return { label, text, width: Math.ceil(textWidth(text, scale) + 16 * scale + extra), head: headOnBranch };
}

export const colorVar = (c: number) => (c >= 0 ? `var(--color-graph-${c})` : c === -1 ? "var(--color-graph-main)" : "var(--color-graph-unreachable)");

function edgePath(from: GraphNode, to: GraphNode, g: Geometry): string {
  const COL = g.d.col;
  const x1 = g.x(from);
  const y1 = g.y(from);
  const x2 = g.x(to);
  const y2 = g.y(to);
  if (y1 === y2) return `M${x1},${y1} L${x2},${y2}`;
  // Change lanes close to the side of the lane being left: a short curve
  // near the parent when branching off, near the child when merging in.
  const mid = from.lane > to.lane ? x2 + COL * 0.65 : x1 - COL * 0.65;
  const h = 14;
  return `M${x1},${y1} L${Math.max(mid, x2)},${y1} C${mid - h},${y1} ${mid - COL * 0.65 + h},${y2} ${mid - COL * 0.65},${y2} L${x2},${y2}`;
}

type Props = {
  layout: GraphLayout;
  showIds: boolean;
  /** Text size scale: 1 = Default. */
  scale?: number;
  selected?: string | null;
  onSelect?: (id: string) => void;
  /** ids of worktree HEAD commits besides the main one, with folder names */
  extraHeads?: { commit: string; name: string }[];
  ariaLabel: string;
};

export function GraphView({ layout, showIds, scale = 1, selected, onSelect, extraHeads = [], ariaLabel }: Props) {
  const d = dims(showIds, scale);
  const [hovered, setHovered] = useState<string | null>(null);
  // Group labels per commit and order them: current branch (as "HEAD → name"),
  // other local branches, remotes (each right after its local branch), tags,
  // bisect marks. A detached HEAD becomes its own outlined "HEAD" pill.
  const pillsByTarget = useMemo(() => {
    const m = new Map<string, Pill[]>();
    const rank = (l: GraphLabel) => (l.kind === "branch" ? (l.current ? 0 : 1) : l.kind === "remote" ? 2 : l.kind === "tag" ? 3 : 4);
    const groups = new Map<string, GraphLabel[]>();
    for (const lab of layout.labels) {
      if (lab.kind === "stash" || lab.kind === "head") continue;
      groups.set(lab.target, [...(groups.get(lab.target) ?? []), lab]);
    }
    const remoteBase = (n: string) => n.slice(n.indexOf("/") + 1);
    for (const [target, labels] of groups) {
      labels.sort((a, b) => {
        const ra = rank(a);
        const rb = rank(b);
        if (ra !== rb) return ra - rb;
        return a.name.localeCompare(b.name);
      });
      // Remotes follow the local branch of the same name.
      const ordered: GraphLabel[] = [];
      for (const l of labels.filter((x) => x.kind === "branch")) {
        ordered.push(l, ...labels.filter((x) => x.kind === "remote" && remoteBase(x.name) === l.name));
      }
      ordered.push(...labels.filter((x) => x.kind !== "branch" && !ordered.includes(x)));
      m.set(target, ordered.map((l) => pillFor(l, scale, l.kind === "branch" && l.current)));
    }
    if (layout.head.detached && layout.head.commit) {
      const head: GraphLabel = { id: "HEAD", target: layout.head.commit, kind: "head", name: "HEAD", color: -1, current: true, annotated: false };
      m.set(layout.head.commit, [{ label: head, text: "HEAD", width: Math.ceil(textWidth("HEAD", scale) + 16 * scale), head: true }, ...(m.get(layout.head.commit) ?? [])]);
    }
    return m;
  }, [layout, scale]);

  // Labels go right of a commit only if nothing follows it in its lane;
  // otherwise they stack above it, clear of the line.
  const byIdTmp = new Map(layout.nodes.map((n) => [n.id, n]));
  const isTip = (n: GraphNode) => !layout.nodes.some((o) => o.lane === n.lane && o.row < n.row && o.kind !== "more");
  const labelRoom = useMemo(() => {
    let w = 0;
    for (const [target, pills] of pillsByTarget) {
      const n = byIdTmp.get(target);
      if (n && isTip(n)) w = Math.max(w, pills.reduce((a, p) => a + p.width + PILL_GAP, STUB));
    }
    return w + 24;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pillsByTarget]);

  const g = geometry(layout, labelRoom, d);
  const byId = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout]);
  const scroller = useRef<HTMLDivElement>(null);

  // Keep HEAD (or the newest commit) in view after every update.
  const headNode = layout.head.commit ? byId.get(layout.head.commit) : layout.nodes[0];
  const headX = headNode ? g.x(headNode) : 0;
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const want = headX + labelRoom + 40 - el.clientWidth;
    if (want > el.scrollLeft || headX < el.scrollLeft) {
      el.scrollTo({ left: Math.max(0, want), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  }, [headX, labelRoom]);

  // Remember node positions so new commits can grow in place and moved ones slide.
  const seen = useRef(new Set<string>());
  useEffect(() => {
    seen.current = new Set(layout.nodes.map((n) => n.id));
  }, [layout]);

  if (layout.nodes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <CircleDashed size={24} strokeWidth={1.5} className="text-edge-2" aria-hidden />
        <div className="text-sm font-medium">No commits yet.</div>
        <div className="text-xs text-fg-3">Your first commit will appear here.</div>
      </div>
    );
  }

  return (
    <div ref={scroller} className="flex h-full w-full items-center overflow-auto">
      <svg width={Math.max(g.width, 200)} height={g.height} role="img" aria-label={ariaLabel} className="canopy-graph my-auto block shrink-0">
        <g className="edges">
          {layout.edges
            .filter((e) => e.kind !== "copy" || e.from === selected || e.from === hovered || e.to === selected || e.to === hovered)
            .map((e) => (
              <Edge key={e.id} edge={e} byId={byId} g={g} />
            ))}
        </g>
        <g className="nodes">
          {layout.nodes.map((n) => (
            <Node
              key={n.id}
              node={n}
              g={g}
              isNew={!seen.current.has(n.id)}
              isHead={layout.head.commit === n.id}
              selected={selected === n.id}
              showId={showIds}
              onSelect={onSelect}
              onHover={setHovered}
            />
          ))}
        </g>
        <g className="labels">
          {[...pillsByTarget.entries()].map(([target, pills]) => {
            const node = byId.get(target);
            return node ? <Flags key={target} node={node} pills={pills} g={g} beside={isTip(node)} /> : null;
          })}
          {extraHeads.map((h) => {
            const node = byId.get(h.commit);
            if (!node) return null;
            return (
              <g key={`wt-${h.name}`} style={{ transform: `translate(${g.x(node)}px, ${g.y(node)}px)` }} className="mv">
                <circle r={R + 5} fill="none" stroke="var(--color-graph-head)" strokeWidth={1.5} strokeDasharray="2 2" />
                <text y={-R - 10} textAnchor="middle" className="g-meta">
                  HEAD · {h.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

function Edge({ edge, byId, g }: { edge: GraphEdge; byId: Map<string, GraphNode>; g: Geometry }) {
  const from = byId.get(edge.from);
  const to = byId.get(edge.to);
  if (!from || !to) return null;
  if (edge.kind === "copy") {
    const x1 = g.x(from);
    const y1 = g.y(from);
    const x2 = g.x(to);
    const y2 = g.y(to);
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const ux = (x2 - x1) / len;
    const uy = (y2 - y1) / len;
    const sx = x1 + ux * (R + 3);
    const sy = y1 + uy * (R + 3);
    const ex = x2 - ux * (R + 5);
    const ey = y2 - uy * (R + 5);
    return (
      <g className="fade-in copy-arrow">
        <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="var(--color-fg-3)" strokeWidth={1.5} strokeDasharray="1.5 3" strokeLinecap="round" />
        <path
          d={`M${ex},${ey} l${-ux * 6 - uy * 3.5},${-uy * 6 + ux * 3.5} M${ex},${ey} l${-ux * 6 + uy * 3.5},${-uy * 6 - ux * 3.5}`}
          stroke="var(--color-fg-3)"
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  }
  if (edge.kind === "revert") {
    // Dashed curve arching above the lane, with a small "undoes" label.
    const x1 = g.x(from);
    const x2 = g.x(to);
    const y = Math.min(g.y(from), g.y(to));
    const mid = (x1 + x2) / 2;
    const lift = Math.min(40, 14 + Math.abs(x1 - x2) / 6);
    return (
      <g className="fade-in">
        <path d={`M${x1},${y - R - 2} Q${mid},${y - R - 2 - lift * 2} ${x2},${y - R - 2}`} fill="none" stroke="var(--color-fg-3)" strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={mid} y={y - R - 2 - lift + 3} textAnchor="middle" className="g-meta" style={{ fontSize: 10 }}>
          undoes
        </text>
      </g>
    );
  }
  const dashed = edge.kind === "ghost";
  const gray = edge.kind === "ghost" || edge.kind === "lost";
  return (
    <path
      key={`${edge.id}:${g.x(from)},${g.y(from)},${g.x(to)},${g.y(to)}`}
      className="fade-in"
      d={edgePath(from, to, g)}
      fill="none"
      stroke={gray ? "var(--color-graph-ghost)" : colorVar(edge.color)}
      strokeWidth={dashed ? 1.5 : 2}
      strokeDasharray={dashed ? "4 3" : undefined}
      strokeLinecap="round"
      opacity={edge.kind === "ghost" ? 0.55 : 1}
    />
  );
}

function Node({
  node,
  g,
  isNew,
  isHead,
  selected,
  showId,
  onSelect,
  onHover,
}: {
  node: GraphNode;
  g: Geometry;
  isNew: boolean;
  isHead: boolean;
  selected: boolean;
  showId: boolean;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
}) {
  const x = g.x(node);
  const y = g.y(node);
  const style = { transform: `translate(${x}px, ${y}px)` };
  if (node.kind === "more") {
    const text = `${node.hidden} earlier ${node.hidden === 1 ? "commit" : "commits"}`;
    const w = textWidth(text, g.d.scale, 400) + 16;
    return (
      <g style={style} className="mv">
        <rect x={-w + R} y={-9} width={w} height={18} rx={9} fill="var(--color-sunken)" stroke="var(--color-edge-2)" />
        <text x={-w / 2 + R} y={4} textAnchor="middle" className="g-meta" fill="var(--color-fg-2)">
          {text}
        </text>
      </g>
    );
  }
  const fill = colorVar(node.color);
  const short = node.id.slice(0, 7);
  const time = new Date(node.time * 1000).toLocaleString();
  return (
    <g
      style={style}
      className="mv node"
      // Keep focus where it is (e.g. a commit question input) so a click can fill it.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onSelect?.(node.id)}
      onMouseEnter={() => onHover?.(node.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <g className={isNew ? "grow" : undefined}>
      <title>{`${short} · ${node.subject} · ${node.author} · ${time}`}</title>
      {/* larger invisible hit area */}
      <circle r={R + 6} fill="transparent" />
      {node.kind === "ghost" ? (
        <circle r={R} fill="none" stroke="var(--color-graph-ghost)" strokeWidth={1.5} strokeDasharray="3 2.5" opacity={0.55} />
      ) : node.kind === "merge" ? (
        <>
          <circle r={R} fill={fill} />
          <circle r={R - 2.5} fill="none" stroke="var(--color-canvas)" strokeWidth={2} />
        </>
      ) : (
        <circle r={R} fill={fill} />
      )}
      {isHead && <circle r={R + 5} fill="none" stroke="var(--color-graph-head)" strokeWidth={2} />}
      {selected && <circle r={R + 3} fill="none" stroke="var(--color-fg)" strokeWidth={1.5} />}
      <text y={24 * g.d.scale} textAnchor="middle" className={showId ? "g-id" : "g-subject"} opacity={node.kind === "ghost" || node.kind === "lost" ? 0.7 : 1}>
        {showId ? short : node.subject.length > SUBJECT_CHARS ? `${node.subject.slice(0, SUBJECT_CHARS - 1)}…` : node.subject}
      </text>
      </g>
    </g>
  );
}

function Flags({ node, pills, g, beside }: { node: GraphNode; pills: Pill[]; g: Geometry; beside: boolean }) {
  if (pills.length === 0) return null;
  const h = PILL_H * g.d.scale;
  const x = g.x(node);
  const y = g.y(node);
  if (beside) {
    // One row at node level, right of the commit, joined by a short stub.
    let cx = R + 1 + STUB;
    const placed = pills.map((p) => {
      const at = cx;
      cx += p.width + PILL_GAP;
      return { p, at };
    });
    const stubColor = pills[0].head && pills[0].label.kind === "head" ? "var(--color-fg-2)" : colorVar(pills[0].label.color);
    return (
      <g className="mv" style={{ transform: `translate(${x}px, ${y}px)` }}>
        <line x1={R + 1} y1={0} x2={R + 1 + STUB} y2={0} stroke={stubColor} strokeWidth={2} />
        {placed.map(({ p, at }) => (
          <Flag key={p.label.id} pill={p} x={at} y={-h / 2} h={h} />
        ))}
      </g>
    );
  }
  // Above the node, centred, growing upwards; more than two collapse to +N.
  const shown = pills.length > 2 ? [pills[0], { label: { ...pills[0].label, id: "more", kind: "tag" as const, name: `+${pills.length - 1}`, annotated: false }, text: `+${pills.length - 1}`, width: Math.ceil(textWidth(`+${pills.length - 1}`, g.d.scale) + 24), head: false }] : pills;
  return (
    <g className="mv" style={{ transform: `translate(${x}px, ${y}px)` }}>
      {pills.length > 2 && <title>{pills.map((p) => p.text).join(", ")}</title>}
      {shown.map((p, i) => (
        <Flag key={p.label.id} pill={p} x={-p.width / 2} y={-(14 * g.d.scale) - h - i * (h + 4)} h={h} />
      ))}
    </g>
  );
}

function Flag({ pill, x, y, h }: { pill: Pill; x: number; y: number; h: number }) {
  const { label, text, width: w } = pill;
  const color = colorVar(label.color);
  const ty = y + h / 2;
  const t = { x: x + w / 2, y: ty, dominantBaseline: "central" as const, textAnchor: "middle" as const, className: "g-flag" };
  if (label.kind === "head") {
    // Detached HEAD: outlined, neutral.
    return (
      <g>
        <title>HEAD points straight at this commit, not at a branch (detached HEAD).</title>
        <rect x={x} y={y} width={w} height={h} rx={h / 2} fill="var(--color-canvas)" stroke="var(--color-fg-2)" strokeWidth={1.5} />
        <text {...t} fill="var(--color-fg)">
          HEAD
        </text>
      </g>
    );
  }
  if (label.kind === "bisect") {
    const tone = label.name === "bad" || label.name === "new" ? "var(--color-danger)" : label.name === "skip" ? "var(--color-fg-3)" : "var(--color-success)";
    return (
      <g>
        <title>{`bisect: marked ${label.name}`}</title>
        <rect x={x} y={y} width={w} height={h} rx={4} fill="var(--color-canvas)" stroke={tone} strokeWidth={1.5} />
        <text {...t} fill={tone} style={{ fontWeight: 500 }}>
          {text}
        </text>
      </g>
    );
  }
  if (label.kind === "tag") {
    const dot = label.annotated;
    return (
      <g>
        <title>{label.id === "more" ? text : dot ? "Annotated tag: has its own message, author and date." : "Lightweight tag: just a name for a commit."}</title>
        <path d={`M${x + 6},${y} H${x + w} V${y + h} H${x + 6} L${x},${ty} Z`} fill="var(--color-canvas)" stroke="var(--color-fg-2)" strokeWidth={1.5} strokeLinejoin="round" />
        <text {...t} x={x + 3 + (w - (dot ? 8 : 0)) / 2} fill="var(--color-fg)" style={{ fontWeight: 500 }}>
          {text}
        </text>
        {dot && <circle cx={x + w - 9} cy={ty} r={2.5} fill="var(--color-fg)" />}
      </g>
    );
  }
  if (label.kind === "remote") {
    const slash = text.indexOf("/");
    return (
      <g>
        <title>Remote-tracking branch: your bookmark of where the remote was at the last fetch.</title>
        <rect x={x} y={y} width={w} height={h} rx={h / 2} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />
        <text {...t} fill={color}>
          <tspan style={{ fontWeight: 400 }}>{text.slice(0, slash + 1)}</tspan>
          {text.slice(slash + 1)}
        </text>
      </g>
    );
  }
  return (
    <g>
      {pill.head && <title>{`HEAD points at ${label.name}: this is the branch you are on.`}</title>}
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={color} />
      <text {...t} fill="var(--color-graph-label-fg)">
        {pill.head ? (
          <>
            <tspan style={{ fontWeight: 500 }}>HEAD → </tspan>
            {label.name}
          </>
        ) : (
          text
        )}
      </text>
    </g>
  );
}
