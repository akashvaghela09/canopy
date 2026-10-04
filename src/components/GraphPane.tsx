// Center-top pane: the commit graph for the repo the learner is looking at
// (DESIGN.md 4.4).

import { Archive, Circle, CircleDashed, CircleHelp, Copy, GitMerge, Tag as TagIcon, Terminal as TerminalIcon, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import type { RepoSnapshot } from "../api";
import { GraphView, graphHeight } from "../graph/GraphView";
import type { OtherWorktree } from "../graph/geometry";
import { layout } from "../graph/layout";
import type { Snapshot } from "../graph/types";
import { lessonActions, useAppDispatch, useAppSelector } from "../store";
import { Button, IconButton, PaneHeader } from "./ui";

/** The repo whose folder contains the terminal's cwd, if any. */
export function repoForCwd(repos: RepoSnapshot[], cwd: string | null | undefined): RepoSnapshot | undefined {
  if (cwd === null || cwd === undefined) return undefined;
  return repos
    .filter((r) => r.path === "." || cwd === r.path || cwd.startsWith(`${r.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
}

export function useActiveRepo(): { repos: RepoSnapshot[]; active: RepoSnapshot | undefined; cwdRepo: RepoSnapshot | undefined } {
  const update = useAppSelector((s) => s.lesson.update);
  const meta = useAppSelector((s) => s.lesson.view?.meta);
  const pinned = useAppSelector((s) => s.lesson.pinnedRepo);
  const repos = update?.repos ?? [];
  const cwdRepo = repoForCwd(repos, update?.cwd);
  const active =
    (pinned ? repos.find((r) => r.path === pinned) : undefined) ?? cwdRepo ?? repos.find((r) => r.path === meta?.repo) ?? repos[0];
  return { repos, active, cwdRepo };
}

/** Height the pane wants: header (if any) + graph + stash strip, clamped. */
export function GraphPane({ showIds, maxHeight, manualHeight }: { showIds: boolean; maxHeight: number; manualHeight: number | null }) {
  const dispatch = useAppDispatch();
  const pinned = useAppSelector((s) => s.lesson.pinnedRepo);
  const { repos, active, cwdRepo } = useActiveRepo();
  const snap = active?.snapshot ?? null;
  const [selected, setSelected] = useState<string | null>(null);
  const [sideBySide, setSideBySide] = useState(false);
  const asText = useAppSelector((s) => s.app.settings.graphText === "1");
  const starting = useAppSelector((s) => s.lesson.status === "starting" || (s.lesson.status === "running" && !s.lesson.update));
  const origin = repos.find((r) => r.snapshot?.bare);
  const showSide = sideBySide && origin !== undefined && origin.path !== active?.path;
  const originGraph = useMemo(() => (showSide && origin?.snapshot ? layout(origin.snapshot) : null), [showSide, origin]);
  const graph = useMemo(() => (snap ? layout(snap) : null), [snap]);
  const selectedCommit = snap?.commits.find((c) => c.id === selected) ?? null;
  const others = useMemo(() => otherWorktrees(snap), [snap]);

  // A header only when it holds a control (multi-repo lessons).
  const hasHeader = repos.length > 1;
  const lanes = Math.max(graph ? graphHeight(graph, showIds) : 0, originGraph ? graphHeight(originGraph, showIds) : 0);
  const content = (hasHeader ? 36 : 0) + (asText ? 220 : Math.max(lanes, 100)) + (snap && snap.stashes.length > 0 ? 32 : 0);
  const height = manualHeight ?? Math.min(Math.max(content, 136), Math.max(136, maxHeight));

  return (
    <section
      role="region"
      aria-label="Graph"
      className={`flex min-h-0 shrink-0 flex-col bg-canvas ${manualHeight === null ? "transition-[height] duration-[var(--dur-slow)]" : ""}`}
      style={{ height }}
      data-pane="graph"
      tabIndex={-1}
    >
      {hasHeader && (
        <PaneHeader label="Graph">
          {repos.length > 1 && pinned !== null && (
            <Button variant="link" size="sm" className="mr-1 text-xs" onClick={() => dispatch(lessonActions.pinRepo(null))} title="Show the repo the terminal is in (Alt+G)">
              Follow terminal
            </Button>
          )}
          <div role="radiogroup" aria-label="Repository" className="flex h-7 overflow-hidden rounded-sm border border-edge-2 text-xs font-medium">
            {repos.map((r) => {
              const on = !showSide && r.path === active?.path;
              return (
                <button
                  key={r.path}
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    setSideBySide(false);
                    dispatch(lessonActions.pinRepo(r.path));
                  }}
                  title={cwdRepo?.path === r.path ? "The terminal is in this repo" : undefined}
                  className={`flex items-center gap-1 px-2.5 ${on ? "bg-ink text-ink-fg" : "text-fg-2 hover:bg-sunken"}`}
                >
                  {cwdRepo?.path === r.path && <TerminalIcon size={12} aria-label="terminal is here" />}
                  {r.label}
                </button>
              );
            })}
            {origin && active && !active.snapshot?.bare && (
              <button
                role="radio"
                aria-checked={showSide}
                onClick={() => setSideBySide(true)}
                className={`px-2.5 ${showSide ? "bg-ink text-ink-fg" : "text-fg-2 hover:bg-sunken"}`}
                title="Show your clone and origin side by side"
              >
                {active.label} + {origin.label}
              </button>
            )}
          </div>
        </PaneHeader>
      )}
      <div className="flex min-h-0 flex-1">
        <div className="relative min-h-0 min-w-0 flex-1">
          {/* State chips float in the canvas instead of taking a row. */}
          {(snap?.operation || snap?.head.detached) && (
            <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-col items-start gap-1">
              {snap?.operation && (
                <span className="inline-flex h-6 items-center gap-1 rounded-sm border border-warning/50 bg-warning-soft px-2 text-xs font-medium text-fg">
                  <GitMerge size={12} /> {operationLabel(snap.operation)} in progress
                  {snap.workingTree.conflicted.length > 0 ? " · conflict" : ""}
                </span>
              )}
              {snap?.head.detached && (
                <span className="inline-flex h-6 items-center gap-1 rounded-sm border border-warning/50 bg-warning-soft px-2 text-xs text-fg">
                  HEAD is detached: new commits here belong to no branch.
                </span>
              )}
            </div>
          )}
          {selectedCommit && !asText && <CommitCard commit={selectedCommit} onClose={() => setSelected(null)} />}
          {graph && snap && asText ? (
            <GraphText snap={snap} />
          ) : graph && snap ? (
            <GraphView
              layout={graph}
              showIds={showIds}
              selected={selected}
              onSelect={(id) => {
                // A focused "which commit" answer box takes the clicked id (DESIGN.md 7.7).
                const el = document.activeElement as HTMLElement | null;
                if (el?.dataset.commitQuestion) {
                  el.dispatchEvent(new CustomEvent("canopy-insert-commit", { detail: id.slice(0, 7) }));
                  return;
                }
                setSelected((s) => (s === id ? null : id));
              }}
              others={others}
              ariaLabel={describe(snap)}
            />
          ) : starting ? (
            <GraphSkeleton />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-fg-3">
              {active?.error ? `Could not read this repo: ${active.error}` : "No repository here yet."}
            </div>
          )}
          {graph && graph.nodes.length > 0 && !asText && <GraphKey />}
        </div>
        {showSide && originGraph && origin?.snapshot && (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col border-l border-edge">
            <div className="px-3 pt-2 text-xs text-fg-3">{origin.label} (bare)</div>
            <div className="min-h-0 flex-1">
              <GraphView layout={originGraph} showIds={showIds} ariaLabel={`origin: ${describe(origin.snapshot)}`} />
            </div>
          </div>
        )}
      </div>
      {snap && snap.stashes.length > 0 && (
        <div className="flex h-8 shrink-0 items-center gap-2 overflow-x-auto border-t border-edge px-3" aria-label="Stashes">
          <span className="text-xs text-fg-3">Stashes</span>
          {snap.stashes.map((s) => (
            <span key={s.index} className="flex h-6 items-center gap-1 rounded-sm border border-dashed border-edge-2 px-2 font-mono text-2xs whitespace-nowrap text-fg-2" title={s.message}>
              <Archive size={12} />
              stash@{"{"}
              {s.index}
              {"}"} · {s.message.length > 40 ? `${s.message.slice(0, 40)}…` : s.message}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

/** "Key" button in the corner; the popover opens by itself once, after the first command changes the graph. */
function GraphKey() {
  const [open, setOpen] = useState(false);
  const commands = useAppSelector((s) => s.lesson.update?.commands ?? 0);
  useEffect(() => {
    if (commands < 1) return;
    try {
      if (localStorage.getItem("canopy.graphKeySeen")) return;
      localStorage.setItem("canopy.graphKeySeen", "1");
    } catch {
      return;
    }
    setOpen(true);
  }, [commands]);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("pointerdown", close, { once: true });
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);
  const row = (icon: React.ReactNode, text: string) => (
    <li className="flex items-center gap-2">
      <span className="flex w-24 shrink-0 justify-center">{icon}</span>
      {text}
    </li>
  );
  return (
    <div className="absolute top-2 right-3 z-30">
      {open && (
        <ul className="absolute top-8 right-0 w-[22rem] space-y-1.5 rounded-md border border-edge-2 bg-raised p-3 text-xs text-fg shadow-[0_4px_12px_oklch(0%_0_0/0.12)]" role="note" aria-label="Graph key">
          {row(<Circle size={10} className="fill-[var(--color-graph-main)] text-[var(--color-graph-main)]" />, "a commit; its message is under it")}
          {row(
            <span className="relative flex size-[22px] items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-[var(--color-graph-main)]" style={{ opacity: "var(--graph-halo-alpha)" }} />
              <span className="size-3 rounded-full bg-[var(--color-graph-main)]" />
            </span>,
            "soft glow: HEAD, the commit you are on",
          )}
          {row(<span className="rounded-full bg-[var(--color-graph-main)] px-1.5 font-mono text-[0.625rem] font-semibold text-[var(--color-graph-label-fg)]">HEAD → main</span>, "you are on branch main")}
          {row(<span className="rounded-full border border-dashed border-[var(--color-graph-main)] px-1.5 font-mono text-[0.625rem] text-[var(--color-graph-main)]">origin/main</span>, "the remote's copy, as of your last fetch")}
          {row(
            <span className="inline-flex items-center gap-1 rounded-[4px] border border-edge-2 px-1.5 font-mono text-[0.625rem] font-medium">
              <TagIcon size={10} className="text-fg-2" /> v1.0
            </span>,
            "a tag (filled icon: annotated)",
          )}
          {row(<Copy size={12} className="text-fg-2" />, "checked out in another folder (worktree)")}
          {row(<Circle size={10} className="fill-[var(--color-graph-unreachable)] text-[var(--color-graph-unreachable)]" />, "grey: on no branch")}
          {row(<CircleDashed size={12} className="text-[var(--color-graph-unreachable)]" />, "dashed: replaced by a newer copy")}
          {row(<span className="text-fg-2">→</span>, "time runs left to right")}
        </ul>
      )}
      <Button
        variant="ghost"
        size="sm"
        icon={CircleHelp}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Key
      </Button>
    </div>
  );
}

function operationLabel(op: string) {
  return { merge: "Merge", rebase: "Rebase", am: "Applying patches", "cherry-pick": "Cherry-pick", revert: "Revert", bisect: "Bisect" }[op] ?? op;
}

/** Worktrees besides the main one: their HEADs show on the branch pills. */
function otherWorktrees(snap: Snapshot | null): OtherWorktree[] {
  if (!snap || snap.worktrees.length < 2) return [];
  return snap.worktrees.slice(1).map((w) => ({ name: w.path.split("/").pop() ?? w.path, head: w.head, branch: w.branch }));
}

/** Text summary of the graph for screen readers (DESIGN.md 10.3). */
function describe(s: Snapshot): string {
  const reachable = s.commits.filter((c) => c.reachable).length;
  const branches = s.refs.filter((r) => r.kind === "branch").map((r) => r.name);
  const head = s.head.detached ? "HEAD is detached" : s.head.branch ? `HEAD on ${s.head.branch}` : "no commits yet";
  return `${reachable} ${reachable === 1 ? "commit" : "commits"}. Branches: ${branches.join(", ") || "none"}. ${head}.`;
}

/** The graph as a plain list, for screen readers and copying (DESIGN.md 10.3). */
function GraphText({ snap }: { snap: Snapshot }) {
  const labels = new Map<string, string[]>();
  for (const r of snap.refs) labels.set(r.target, [...(labels.get(r.target) ?? []), r.kind === "tag" ? `tag ${r.name}` : r.name]);
  if (snap.head.commit) labels.set(snap.head.commit, [snap.head.detached ? "HEAD (detached)" : `HEAD -> ${snap.head.branch}`, ...(labels.get(snap.head.commit) ?? [])]);
  return (
    <ol className="selectable h-full overflow-auto p-3 font-mono text-xs" aria-label="Commits, newest first">
      {snap.commits.map((c) => (
        <li key={c.id} className={`py-0.5 ${c.reachable ? "" : "text-fg-3"}`}>
          <span className="text-fg-2">{c.id.slice(0, 7)}</span> {c.subject}
          {labels.get(c.id) && <span className="text-accent"> ({labels.get(c.id)!.join(", ")})</span>}
          {c.parents.length > 1 && <span className="text-fg-3"> merge of {c.parents.map((p) => p.slice(0, 7)).join(" + ")}</span>}
          {!c.reachable && <span> (not on any branch)</span>}
        </li>
      ))}
    </ol>
  );
}

/** Details for the clicked commit (DESIGN.md 8, "Node"). */
function CommitCard({ commit, onClose }: { commit: Snapshot["commits"][number]; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="absolute top-2 right-2 z-10 w-72 rounded-md border border-edge-2 bg-raised p-3 text-sm shadow-[0_4px_12px_oklch(0%_0_0/0.12)]" role="dialog" aria-label="Commit details">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 font-medium break-words">{commit.subject}</div>
        <IconButton icon={X} label="Close" onClick={onClose} />
      </div>
      <div className="mt-1 text-xs text-fg-2">
        {commit.author} · {new Date(commit.time * 1000).toLocaleString()}
        {!commit.reachable && " · on no branch"}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <code className="selectable rounded-sm bg-sunken px-1.5 font-mono text-xs">{commit.id.slice(0, 7)}</code>
        <Button
          variant="ghost"
          size="sm"
          icon={Copy}
          onClick={() => {
            navigator.clipboard.writeText(commit.id);
            setCopied(true);
          }}
        >
          {copied ? "Copied" : "Copy id"}
        </Button>
      </div>
    </div>
  );
}

/** Placeholder commits while the lesson's repo is being set up. */
function GraphSkeleton() {
  return (
    <div role="status" aria-label="Setting up the lesson" className="flex h-full items-center gap-0 px-10">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center">
          {i > 0 && <div className="skeleton h-0.5 w-20" />}
          <div className="skeleton size-3 rounded-full" />
        </div>
      ))}
    </div>
  );
}
