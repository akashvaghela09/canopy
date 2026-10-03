// Center-top pane: the commit graph for the repo the learner is looking at
// (DESIGN.md 4.4).

import { Archive, ChevronDown, ChevronUp, Columns2, Eye, GitMerge, List, Terminal as TerminalIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { RepoSnapshot } from "../api";
import { GraphView } from "../graph/GraphView";
import { layout } from "../graph/layout";
import type { Snapshot } from "../graph/types";
import { lessonActions, useAppDispatch, useAppSelector } from "../store";
import { Banner, IconButton, PaneHeader } from "./ui";

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

export function GraphPane({ collapsed, onToggle, showIds }: { collapsed: boolean; onToggle: () => void; showIds: boolean }) {
  const dispatch = useAppDispatch();
  const pinned = useAppSelector((s) => s.lesson.pinnedRepo);
  const { repos, active, cwdRepo } = useActiveRepo();
  const snap = active?.snapshot ?? null;
  const [selected, setSelected] = useState<string | null>(null);
  const [sideBySide, setSideBySide] = useState(false);
  const [asText, setAsText] = useState(false);
  const origin = repos.find((r) => r.snapshot?.bare);
  const showSide = sideBySide && origin !== undefined && origin.path !== active?.path;
  const originGraph = useMemo(() => (showSide && origin?.snapshot ? layout(origin.snapshot) : null), [showSide, origin]);
  const graph = useMemo(() => (snap ? layout(snap) : null), [snap]);
  const extraHeads = useMemo(() => worktreeHeads(snap), [snap]);

  return (
    <section role="region" aria-label="Graph" className="flex h-full min-h-0 flex-col bg-canvas" data-pane="graph" tabIndex={-1}>
      <PaneHeader label="Graph" context={repos.length <= 1 ? active?.label : undefined}>
        {snap?.operation && (
          <span className="mr-2 inline-flex h-5 items-center gap-1 rounded-sm border border-warning/50 bg-warning-soft px-1.5 text-2xs font-medium text-fg">
            <GitMerge size={12} /> {operationLabel(snap.operation)} in progress
            {snap.workingTree.conflicted.length > 0 ? " · conflict" : ""}
          </span>
        )}
        {repos.length > 1 && (
          <div role="radiogroup" aria-label="Repository" className="mr-1 flex h-7 overflow-hidden rounded-sm border border-edge-2 text-xs font-medium">
            {repos.map((r) => {
              const on = r.path === active?.path;
              return (
                <button
                  key={r.path}
                  role="radio"
                  aria-checked={on}
                  onClick={() => dispatch(lessonActions.pinRepo(r.path))}
                  className={`flex items-center gap-1 px-2.5 ${on ? "bg-ink text-ink-fg" : "text-fg-2 hover:bg-sunken"}`}
                >
                  {cwdRepo?.path === r.path && <TerminalIcon size={12} aria-label="terminal is here" />}
                  {r.label}
                </button>
              );
            })}
          </div>
        )}
        {repos.length > 1 && (
          <IconButton
            icon={Eye}
            label="Follow terminal (Alt+G)"
            pressed={pinned === null}
            onClick={() => dispatch(lessonActions.pinRepo(pinned === null ? (active?.path ?? null) : null))}
          />
        )}
        <IconButton icon={List} label="Graph as text" pressed={asText} onClick={() => setAsText((v) => !v)} />
        {origin && (
          <IconButton icon={Columns2} label="Show origin side by side" pressed={sideBySide} onClick={() => setSideBySide((v) => !v)} />
        )}
        <IconButton icon={collapsed ? ChevronDown : ChevronUp} label={collapsed ? "Expand graph" : "Collapse graph"} onClick={onToggle} />
      </PaneHeader>
      {!collapsed && (
        <>
          {snap?.head.detached && (
            <Banner tone="warning" title="HEAD is detached." className="mx-3 mt-2">
              New commits here belong to no branch. Create a branch if you want to keep them.
            </Banner>
          )}
          <div className="flex min-h-0 flex-1">
            <div className="min-h-0 min-w-0 flex-1">
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
                extraHeads={extraHeads}
                ariaLabel={describe(snap)}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-fg-3">
                {active?.error ? `Could not read this repo: ${active.error}` : "No repository here yet."}
              </div>
            )}
            </div>
            {showSide && originGraph && origin?.snapshot && (
              <div className="flex min-h-0 min-w-0 flex-1 flex-col border-l border-edge">
                <div className="px-3 pt-2 text-2xs font-semibold tracking-[0.06em] text-fg-3 uppercase">{origin.label} (bare)</div>
                <div className="min-h-0 flex-1">
                  <GraphView layout={originGraph} showIds={showIds} ariaLabel={`origin: ${describe(origin.snapshot)}`} />
                </div>
              </div>
            )}
          </div>
          {snap && snap.stashes.length > 0 && (
            <div className="flex h-8 shrink-0 items-center gap-2 overflow-x-auto border-t border-edge px-3" aria-label="Stashes">
              <span className="text-2xs font-semibold tracking-[0.06em] text-fg-3 uppercase">Stashes</span>
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
        </>
      )}
    </section>
  );
}

function operationLabel(op: string) {
  return { merge: "Merge", rebase: "Rebase", am: "Applying patches", "cherry-pick": "Cherry-pick", revert: "Revert", bisect: "Bisect" }[op] ?? op;
}

function worktreeHeads(snap: Snapshot | null) {
  if (!snap || snap.worktrees.length < 2) return [];
  return snap.worktrees
    .slice(1)
    .filter((w) => w.head)
    .map((w) => ({ commit: w.head!, name: w.path.split("/").pop() ?? w.path }));
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
