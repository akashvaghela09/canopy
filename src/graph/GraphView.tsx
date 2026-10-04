// SVG renderer for a GraphLayout (docs/design/GRAPH_SPEC.md).
// Horizontal: time flows left -> right, newest on the right, main on the
// bottom lane. Positions are SVG transform attributes (never CSS transforms,
// which WebKitGTK can place differently from the edge coordinates); only
// opacity animates.

import { CircleDashed, Tag } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ABOVE_Y, computeGeometry, HALO_R, moreText, PILL_GAP, PILL_H, R, SEL_R, STUB, SUBJECT_Y, type Geometry, type Measure, type OtherWorktree, type Pill, type Row } from "./geometry";
import type { GraphEdge, GraphLayout, GraphNode } from "./layout";
import "./graph.css";

// Text widths from the real fonts, so pills and subjects fit exactly.
let measureCtx: CanvasRenderingContext2D | null = null;
export const measureText: Measure = (text, weight, font) => {
  measureCtx ??= document.createElement("canvas").getContext("2d");
  if (!measureCtx) return text.length * (font === "mono" ? 6.7 : 6);
  measureCtx.font = font === "mono" ? `${weight} 11px "JetBrains Mono Variable", "JetBrains Mono", monospace` : `${weight} 11px "Inter Variable", Inter, system-ui, sans-serif`;
  return measureCtx.measureText(text).width;
};

/** Natural size of the graph at 100% (the pane sizes itself to this). */
export function graphSize(l: GraphLayout, showIds: boolean): { width: number; height: number } {
  const g = computeGeometry(l, { showIds, measure: measureText });
  return { width: g.width, height: g.height };
}

export const colorVar = (c: number) => (c >= 0 ? `var(--color-graph-${c})` : c === -1 ? "var(--color-graph-main)" : "var(--color-graph-unreachable)");

type Props = {
  layout: GraphLayout;
  showIds: boolean;
  selected?: string | null;
  onSelect?: (id: string) => void;
  /** Worktrees other than the terminal's (their HEADs show on pills). */
  others?: OtherWorktree[];
  /** 1 = 100%. The SVG scales through its viewBox; layout is unchanged. */
  zoom?: number;
  ariaLabel: string;
};

const tr = (x: number, y: number) => `translate(${x} ${y})`;

export function GraphView({ layout, showIds, selected, onSelect, others = [], zoom = 1, ariaLabel }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const g = useMemo(() => computeGeometry(layout, { showIds, others, measure: measureText }), [layout, showIds, others]);
  const byId = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout]);
  const scroller = useRef<HTMLDivElement>(null);

  // Keep HEAD and its labels in view after every update.
  const headNode = layout.head.commit ? byId.get(layout.head.commit) : layout.nodes[0];
  const headX = (headNode ? g.x(headNode) : 0) * zoom;
  const headRow = headNode ? g.rows.get(headNode.id) : undefined;
  const headRight = headX + (headRow?.placement === "beside" ? headRow.left + headRow.width : 60) * zoom;
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const smooth = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (headRight + 24 > el.scrollLeft + el.clientWidth) el.scrollTo({ left: headRight + 24 - el.clientWidth, behavior: smooth });
    else if (headX - 60 < el.scrollLeft) el.scrollTo({ left: Math.max(0, headX - 60), behavior: smooth });
  }, [headX, headRight]);

  // New commits fade in; ones already drawn stay put.
  const seen = useRef(new Set<string>());
  const fresh = useMemo(() => {
    const f = new Set(layout.nodes.filter((n) => !seen.current.has(n.id)).map((n) => n.id));
    // The first render of a graph is not "new".
    if (seen.current.size === 0) f.clear();
    seen.current = new Set(layout.nodes.map((n) => n.id));
    return f;
  }, [layout]);

  if (layout.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-fg-3">
        <CircleDashed size={20} strokeWidth={1.5} className="text-edge-2" aria-hidden />
        No commits yet. Your first commit will appear here.
      </div>
    );
  }

  const headId = layout.head.commit;
  return (
    <div ref={scroller} className="flex h-full w-full items-center overflow-auto">
      <svg width={g.width * zoom} height={g.height * zoom} viewBox={`0 0 ${g.width} ${g.height}`} role="img" aria-label={ariaLabel} className="canopy-graph my-auto block shrink-0">
        <g>
          {layout.edges
            .filter((e) => e.kind !== "copy" && e.kind !== "revert")
            .map((e) => (
              <EdgePath key={`${e.id}:${g.edgePath(e)}`} edge={e} g={g} />
            ))}
        </g>
        <g>
          {layout.edges
            .filter((e) => e.kind === "revert")
            .map((e) => (
              <Revert key={e.id} edge={e} byId={byId} g={g} />
            ))}
          {layout.edges
            .filter((e) => e.kind === "copy" && [e.from, e.to].some((id) => id === selected || id === hovered))
            .map((e) => (
              <CopyArrow key={e.id} edge={e} byId={byId} g={g} />
            ))}
        </g>
        {headId && byId.get(headId) && (
          <circle
            key={`halo:${headId}`}
            className="fade-in"
            transform={tr(g.x(byId.get(headId)!), g.y(byId.get(headId)!))}
            r={HALO_R}
            fill={colorVar(byId.get(headId)!.color)}
            style={{ opacity: "var(--graph-halo-alpha)" }}
          />
        )}
        <g>
          {layout.nodes.map((n) => (
            <Node key={n.id} node={n} g={g} isNew={fresh.has(n.id)} selected={selected === n.id} showId={showIds} onSelect={onSelect} onHover={setHovered} />
          ))}
        </g>
        <g>
          {layout.nodes.map((n) => {
            const row = g.rows.get(n.id);
            return row ? <Labels key={`${n.id}:${row.placement}`} node={n} row={row} g={g} /> : null;
          })}
        </g>
      </svg>
    </div>
  );
}

function EdgePath({ edge, g }: { edge: GraphEdge; g: Geometry }) {
  const d = g.edgePath(edge);
  if (!d) return null;
  const ghost = edge.kind === "ghost";
  const lost = edge.kind === "lost";
  return (
    <path
      className="fade-in"
      d={d}
      fill="none"
      stroke={ghost ? "var(--color-graph-ghost)" : lost ? "var(--color-graph-unreachable)" : colorVar(edge.color)}
      strokeWidth={ghost ? 1.5 : 2}
      strokeDasharray={ghost ? "4 3" : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={ghost ? 0.6 : 1}
    />
  );
}

function CopyArrow({ edge, byId, g }: { edge: GraphEdge; byId: Map<string, GraphNode>; g: Geometry }) {
  const from = byId.get(edge.from);
  const to = byId.get(edge.to);
  if (!from || !to) return null;
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
    <g className="fade-in">
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

function Revert({ edge, byId, g }: { edge: GraphEdge; byId: Map<string, GraphNode>; g: Geometry }) {
  const from = byId.get(edge.from);
  const to = byId.get(edge.to);
  if (!from || !to) return null;
  const x1 = g.x(from);
  const x2 = g.x(to);
  const y = Math.min(g.y(from), g.y(to)) - 8;
  const mid = (x1 + x2) / 2;
  const lift = Math.min(40, Math.max(24, 14 + Math.abs(x1 - x2) / 6));
  return (
    <g className="fade-in">
      <path d={`M${x1},${y} Q${mid},${y - lift * 2} ${x2},${y}`} fill="none" stroke="var(--color-fg-3)" strokeWidth={1.5} strokeDasharray="4 3" />
      <text x={mid} y={y - lift + 3} textAnchor="middle" className="g-meta g-halo">
        undoes
      </text>
    </g>
  );
}

function Node({
  node,
  g,
  isNew,
  selected,
  showId,
  onSelect,
  onHover,
}: {
  node: GraphNode;
  g: Geometry;
  isNew: boolean;
  selected: boolean;
  showId: boolean;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
}) {
  const t = tr(g.x(node), g.y(node));
  if (node.kind === "more") {
    const text = moreText(node);
    const w = measureText(text, 400, "mono") + 16;
    return (
      <g transform={t}>
        <title>{`${node.hidden} older commits are not drawn`}</title>
        <rect x={-w / 2} y={-PILL_H / 2} width={w} height={PILL_H} rx={PILL_H / 2} fill="var(--color-sunken)" />
        <text y={3.5} textAnchor="middle" className="g-meta">
          {text}
        </text>
      </g>
    );
  }
  const fill = colorVar(node.color);
  const short = node.id.slice(0, 7);
  const dim = node.kind === "ghost" || node.kind === "lost";
  return (
    <g
      transform={t}
      className={`node ${isNew ? "fade-in" : ""}`}
      // Keep focus where it is (e.g. a commit question input) so a click can fill it.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onSelect?.(node.id)}
      onMouseEnter={() => onHover?.(node.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <title>{`${short} · ${node.subject} · ${node.author} · ${new Date(node.time * 1000).toLocaleString()}`}</title>
      <circle r={12} fill="transparent" />
      {node.kind === "ghost" ? (
        <circle r={R} fill="var(--color-canvas)" stroke="var(--color-graph-ghost)" strokeWidth={1.5} strokeDasharray="3 2.5" opacity={0.6} />
      ) : node.kind === "merge" ? (
        <>
          <circle r={R} fill={fill} />
          <circle r={3} fill="none" stroke="var(--color-canvas)" strokeWidth={2} />
        </>
      ) : (
        <circle r={R} fill={node.kind === "lost" ? "var(--color-graph-unreachable)" : fill} className="dot" />
      )}
      {selected ? <circle r={SEL_R} fill="none" stroke="var(--color-fg)" strokeWidth={1.5} /> : <circle r={SEL_R} fill="none" stroke="var(--color-fg-3)" strokeWidth={1} className="hover-ring" />}
      <text y={SUBJECT_Y} textAnchor="middle" className={showId ? "g-id" : dim ? "g-subject g-dim" : "g-subject"}>
        {g.subjects.get(node.id)}
      </text>
    </g>
  );
}

function Labels({ node, row, g }: { node: GraphNode; row: Row; g: Geometry }) {
  const x = g.x(node);
  const y = g.y(node);
  const first = row.pills[0];
  const stub = first.kind === "detached" ? "var(--color-ink)" : first.kind === "tag" || first.kind === "bisect" || first.kind === "more" ? "var(--color-edge-2)" : colorVar(first.color);
  const top = row.placement === "beside" ? -PILL_H / 2 : ABOVE_Y;
  let at = row.left;
  return (
    <g transform={tr(x, y)} className="fade-in">
      {row.placement === "beside" ? (
        <line x1={R + 1} y1={0} x2={R + 1 + STUB} y2={0} stroke={stub} strokeWidth={2} />
      ) : (
        <line x1={0} y1={-R - 1} x2={0} y2={ABOVE_Y + PILL_H} stroke={stub} strokeWidth={2} />
      )}
      {row.pills.map((p) => {
        const px = at;
        at += p.width + PILL_GAP;
        return <PillShape key={`${p.kind}:${p.full}`} pill={p} x={px} y={top} />;
      })}
    </g>
  );
}

function PillShape({ pill, x, y }: { pill: Pill; x: number; y: number }) {
  const { kind, text, width: w } = pill;
  const h = PILL_H;
  const cy = y + h / 2;
  const color = colorVar(pill.color);
  const truncated = text !== pill.full;
  // A canvas-coloured outline behind every pill, so a line passing behind reads as behind.
  const halo = <rect x={x - 1} y={y - 1} width={w + 2} height={h + 2} rx={kind === "tag" || kind === "bisect" ? 5 : h / 2 + 1} fill="var(--color-canvas)" />;
  const label = (fill: string, content: React.ReactNode, cx = x + w / 2, cls = "g-flag") => (
    // Explicit baseline: WebKitGTK and Chromium disagree on dominant-baseline with tspans.
    <text x={cx} y={cy + 3.75} textAnchor="middle" className={cls} fill={fill}>
      {content}
    </text>
  );
  const glyph = pill.worktrees && <WorktreeGlyph x={x + w - PILL_GAP - 13} y={cy} color={kind === "worktreeHead" ? "var(--color-fg)" : "var(--color-graph-label-fg)"} />;
  const textCx = pill.worktrees ? x + (w - 13) / 2 : x + w / 2;

  if (kind === "detached" || kind === "worktreeHead") {
    const own = kind === "detached";
    return (
      <g>
        <title>
          {own ? "HEAD points straight at this commit, not at a branch (detached HEAD)." : `Detached HEAD of the worktree in ../${pill.worktrees?.join(", ../")}.`}
        </title>
        {halo}
        <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={own ? "var(--color-ink)" : "var(--color-canvas)"} stroke={own ? undefined : "var(--color-fg-2)"} strokeWidth={own ? undefined : 1.5} />
        {label(own ? "var(--color-ink-fg)" : "var(--color-fg)", "HEAD", textCx)}
        {glyph}
      </g>
    );
  }
  if (kind === "tag" || kind === "more") {
    return (
      <g>
        <title>
          {kind === "more" ? (pill.hidden ?? []).join(", ") : `${truncated ? `${pill.full}. ` : ""}${pill.annotated ? "Annotated tag: has its own message, author and date." : "Lightweight tag: just a name for a commit."}`}
        </title>
        {halo}
        <rect x={x + 0.5} y={y + 0.5} width={w - 1} height={h - 1} rx={4} fill="var(--color-canvas)" stroke="var(--color-edge-2)" />
        {kind === "tag" && <Tag x={x + 6} y={cy - 5} width={10} height={10} strokeWidth={2.5} color="var(--color-fg-2)" fill={pill.annotated ? "var(--color-fg-2)" : "none"} />}
        {label("var(--color-fg)", text, kind === "tag" ? x + 7 + w / 2 : x + w / 2, "g-flag g-flag-tag")}
      </g>
    );
  }
  if (kind === "bisect") {
    const tone = text === "bad" || text === "new" ? "var(--color-danger)" : text === "skip" ? "var(--color-fg-3)" : "var(--color-success)";
    return (
      <g>
        <title>{`bisect: marked ${text}`}</title>
        {halo}
        <rect x={x} y={y} width={w} height={h} rx={4} fill="var(--color-canvas)" stroke={tone} strokeWidth={1.5} />
        {label(tone, text, x + w / 2, "g-flag g-flag-tag")}
      </g>
    );
  }
  if (kind === "remote") {
    const slash = text.indexOf("/");
    return (
      <g>
        <title>{`${pill.full}: your bookmark of where the remote was at the last fetch.`}</title>
        {halo}
        <rect x={x + 0.75} y={y + 0.75} width={w - 1.5} height={h - 1.5} rx={(h - 1.5) / 2} fill="var(--color-canvas)" stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />
        {label(
          color,
          <>
            <tspan style={{ fontWeight: 400 }}>{text.slice(0, slash + 1)}</tspan>
            {text.slice(slash + 1)}
          </>,
        )}
      </g>
    );
  }
  // branch / current branch
  const head = kind === "head";
  return (
    <g>
      <title>
        {[
          head ? `HEAD points at ${pill.full.slice(7)}: this is the branch you are on.` : truncated ? pill.full : "",
          pill.worktrees ? `Checked out in ../${pill.worktrees.join(", ../")}. That folder's HEAD points here.` : "",
        ]
          .filter(Boolean)
          .join(" ")}
      </title>
      {halo}
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={color} />
      {label(
        "var(--color-graph-label-fg)",
        head ? (
          <>
            <tspan style={{ fontWeight: 500 }}>HEAD → </tspan>
            {text.slice(7)}
          </>
        ) : (
          text
        ),
        textCx,
      )}
      {glyph}
    </g>
  );
}

/** ⧉: two offset squares, "checked out in another folder". */
function WorktreeGlyph({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g fill="none" stroke={color} strokeWidth={1.25}>
      <rect x={x} y={y - 2.5} width={7} height={7} rx={1} />
      <rect x={x + 2} y={y - 4.5} width={7} height={7} rx={1} />
    </g>
  );
}
