// Thin SVG renderer for a GraphLayout (DESIGN.md section 8).
// Horizontal: time flows left -> right, newest on the right, main on the
// bottom lane. Only transform and opacity animate.

import { CircleDashed } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { GraphEdge, GraphLabel, GraphLayout, GraphNode } from "./layout";
import "./graph.css";

const COL_IDS = 58; // commit spacing when nodes show 7-char ids
const COL_SUBJECTS = 104; // commit spacing when nodes show (truncated) subjects
const SUBJECT_CHARS = 15;
let COL = COL_SUBJECTS;
const LANE = 56; // spacing between lanes (room for stacked flags)
let PAD_X = 32; // wider when nodes show messages, so the first one is not clipped
const PAD_TOP = 64;
const PAD_BOTTOM = 36;
const R = 6;
const FLAG_H = 18;
const CHAR_W = 6.7; // 11px JetBrains Mono

export type Geometry = {
  width: number;
  height: number;
  x: (n: GraphNode) => number;
  y: (n: GraphNode) => number;
};

export function geometry(l: GraphLayout, labelRoom: number): Geometry {
  const maxRow = Math.max(0, ...l.nodes.map((n) => n.row));
  const x = (n: GraphNode) => PAD_X + (maxRow - n.row) * COL;
  const y = (n: GraphNode) => PAD_TOP + (l.lanes - 1 - n.lane) * LANE;
  return {
    width: PAD_X * 2 + maxRow * COL + labelRoom,
    height: PAD_TOP + (l.lanes - 1) * LANE + PAD_BOTTOM,
    x,
    y,
  };
}

export const colorVar = (c: number) => (c >= 0 ? `var(--color-graph-${c})` : c === -1 ? "var(--color-graph-main)" : "var(--color-graph-unreachable)");

function edgePath(from: GraphNode, to: GraphNode, g: Geometry): string {
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

function flagWidth(text: string) {
  return Math.round(text.length * CHAR_W + 14);
}

type Props = {
  layout: GraphLayout;
  showIds: boolean;
  selected?: string | null;
  onSelect?: (id: string) => void;
  /** ids of worktree HEAD commits besides the main one, with folder names */
  extraHeads?: { commit: string; name: string }[];
  ariaLabel: string;
};

export function GraphView({ layout, showIds, selected, onSelect, extraHeads = [], ariaLabel }: Props) {
  COL = showIds ? COL_IDS : COL_SUBJECTS;
  PAD_X = showIds ? 32 : COL_SUBJECTS / 2 + 4;
  const [hovered, setHovered] = useState<string | null>(null);
  const labelsByTarget = useMemo(() => {
    const m = new Map<string, GraphLabel[]>();
    const order = { branch: 0, remote: 1, tag: 2, bisect: 3, head: 4, stash: 5 };
    for (const lab of layout.labels) {
      if (lab.kind === "stash") continue;
      const arr = m.get(lab.target) ?? [];
      arr.push(lab);
      m.set(lab.target, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => order[a.kind] - order[b.kind] || a.name.localeCompare(b.name));
    return m;
  }, [layout]);

  const labelRoom = useMemo(() => {
    let w = 0;
    for (const arr of labelsByTarget.values()) for (const l of arr) w = Math.max(w, flagWidth(l.name));
    return w + 24;
  }, [labelsByTarget]);

  const g = geometry(layout, labelRoom);
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
              detached={layout.head.detached}
              selected={selected === n.id}
              showId={showIds}
              onSelect={onSelect}
              onHover={setHovered}
            />
          ))}
        </g>
        <g className="labels">
          {[...labelsByTarget.entries()].map(([target, labels]) => {
            const node = byId.get(target);
            return node ? <Flags key={target} node={node} labels={labels} g={g} /> : null;
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
  detached,
}: {
  node: GraphNode;
  g: Geometry;
  isNew: boolean;
  isHead: boolean;
  selected: boolean;
  showId: boolean;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  detached?: boolean;
}) {
  const x = g.x(node);
  const y = g.y(node);
  const style = { transform: `translate(${x}px, ${y}px)` };
  if (node.kind === "more") {
    const text = `${node.hidden} earlier ${node.hidden === 1 ? "commit" : "commits"}`;
    const w = text.length * 6.2 + 16;
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
      {isHead && (
        <>
          <circle r={R + 5} fill="none" stroke="var(--color-graph-head)" strokeWidth={2} />
          <text y={-R - 10} textAnchor="middle" className="g-head">
            {detached ? "HEAD (detached)" : "HEAD"}
          </text>
        </>
      )}
      {selected && <circle r={R + 3} fill="none" stroke="var(--color-fg)" strokeWidth={1.5} />}
      <text y={R + 14} textAnchor="middle" className={showId ? "g-id" : "g-subject"} opacity={node.kind === "ghost" || node.kind === "lost" ? 0.7 : 1}>
        {showId ? short : node.subject.length > SUBJECT_CHARS ? `${node.subject.slice(0, SUBJECT_CHARS - 1)}…` : node.subject}
      </text>
      </g>
    </g>
  );
}

function Flags({ node, labels, g }: { node: GraphNode; labels: GraphLabel[]; g: Geometry }) {
  const flags = labels.filter((l) => l.kind !== "head");
  const x0 = g.x(node) + R + 8;
  const y0 = g.y(node);
  // Stack upward from the node so flags never cover the ids drawn below nodes.
  const n = Math.max(flags.length, 1);
  const top = y0 - FLAG_H / 2 - (n - 1) * (FLAG_H + 2);
  const rowOf = (i: number) => (n - 1 - i) * (FLAG_H + 2);
  if (flags.length === 0) return null;
  return (
    <g className="mv" style={{ transform: `translate(${x0}px, ${top}px)` }}>
      {flags.length > 0 && <line x1={-8 + 2} y1={rowOf(0) + FLAG_H / 2} x2={0} y2={rowOf(0) + FLAG_H / 2} stroke={colorVar(flags[0].color)} strokeWidth={2} />}
      {flags.map((f, i) => (
        <Flag key={f.id} label={f} y={rowOf(i)} />
      ))}

    </g>
  );
}

function Flag({ label, y }: { label: GraphLabel; y: number }) {
  const w = flagWidth(label.name) + (label.annotated ? 10 : 0);
  const color = colorVar(label.color);
  if (label.kind === "bisect") {
    // Bisect marks: a small badge with the term (good / bad / skip or custom).
    const bw = Math.round(label.name.length * 6.2 + 12);
    const tone = label.name === "bad" || label.name === "new" ? "var(--color-danger)" : label.name === "skip" ? "var(--color-fg-3)" : "var(--color-success)";
    return (
      <g transform={`translate(0, ${y})`}>
        <title>{`bisect: marked ${label.name}`}</title>
        <rect width={bw} height={FLAG_H} rx={4} fill="var(--color-canvas)" stroke={tone} strokeWidth={1.5} />
        <text x={bw / 2} y={12.5} textAnchor="middle" className="g-flag" fill={tone} style={{ fontWeight: 500, fontSize: 10 }}>
          {label.name}
        </text>
      </g>
    );
  }
  if (label.kind === "tag") {
    return (
      <g transform={`translate(0, ${y})`}>
        <title>{label.annotated ? "Annotated tag: has its own message, author and date." : "Lightweight tag: just a name for a commit."}</title>
        <path
          d={`M6,0 H${w} V${FLAG_H} H6 L0,${FLAG_H / 2} Z`}
          fill="var(--color-canvas)"
          stroke="var(--color-fg-2)"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <text x={(w + 6 - (label.annotated ? 10 : 0)) / 2} y={12.5} textAnchor="middle" className="g-flag" fill="var(--color-fg)" style={{ fontWeight: 500 }}>
          {label.name}
        </text>
        {label.annotated && <circle cx={w - 8} cy={FLAG_H / 2} r={2.5} fill="var(--color-fg)" />}
      </g>
    );
  }
  if (label.kind === "remote") {
    const slash = label.name.indexOf("/");
    return (
      <g transform={`translate(0, ${y})`}>
        <title>Remote-tracking branch: your bookmark of where the remote was at the last fetch.</title>
        <rect width={w} height={FLAG_H} rx={FLAG_H / 2} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />
        <text x={w / 2} y={12.5} textAnchor="middle" className="g-flag" fill={color}>
          <tspan style={{ fontWeight: 400 }}>{label.name.slice(0, slash + 1)}</tspan>
          {label.name.slice(slash + 1)}
        </text>
      </g>
    );
  }
  return (
    <g transform={`translate(0, ${y})`}>
      <rect width={w} height={FLAG_H} rx={FLAG_H / 2} fill={color} />
      <text x={w / 2} y={12.5} textAnchor="middle" className="g-flag" fill="var(--color-graph-label-fg)">
        {label.name}
      </text>
    </g>
  );
}
