// Lesson workspace: lesson panel | graph, areas strip, terminal | files drawer
// (DESIGN.md 4.1 as revised by REVIEW_2.md items 1–3, 8–11).

import { PanelLeftOpen, PanelRight, PanelRightOpen } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "../api";
import { go, lessonActions, useAppDispatch, useAppSelector } from "../store";
import { EditorSheet } from "./EditorSheet";
import { GraphPane } from "./GraphPane";
import { AreasStrip, Inspector, type InspectorTab, type OpenFile } from "./Inspector";
import { LessonPanel, lessonTabMemory } from "./LessonPanel";
import { Terminal } from "./Terminal";
import { codeFs } from "../theme";
import { Banner, Button, Dialog, PaneHeader, Skeleton } from "./ui";

type Panes = {
  /** Lesson panel width in px, or null for the default clamp(360px, 28vw, 512px). */
  lessonPx: number | null;
  lessonCollapsed: boolean;
  /** Drawer width in px, or null for the default clamp(320px, 24vw, 416px). */
  drawerPx: number | null;
  /** Graph hidden down to its header bar. */
  graphCollapsed: boolean;
};

const DEFAULT_PANES: Panes = { lessonPx: null, lessonCollapsed: false, drawerPx: null, graphCollapsed: false };

/** Pane widths never depend on text size (UX_REVIEW_3.md 3.1). */
function loadPanes(): Panes {
  try {
    const saved = JSON.parse(localStorage.getItem("canopy.panes2") ?? "{}");
    // Older versions stored widths in rem.
    return {
      lessonPx: saved.lessonPx ?? (saved.lessonRem ? saved.lessonRem * 16 : null),
      lessonCollapsed: Boolean(saved.lessonCollapsed),
      drawerPx: saved.drawerPx ?? (saved.drawerRem ? saved.drawerRem * 16 : null),
      graphCollapsed: Boolean(saved.graphCollapsed),
    };
  } catch {
    return DEFAULT_PANES;
  }
}

/** Focus helpers shared with the global keyboard handler. */
export const paneFocus: { terminal?: () => void; clearTerminal?: () => void; toggleDrawer?: () => void } = {};

function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return w;
}

export function Workspace({ lessonId }: { lessonId: string }) {
  const dispatch = useAppDispatch();
  const lesson = useAppSelector((s) => s.lesson);
  const settings = useAppSelector((s) => s.app.settings);
  const [panes, setPanes] = useState<Panes>(loadPanes);
  const [reset, setReset] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [openFile, setOpenFile] = useState<OpenFile | null>(null);
  const [tab, setTab] = useState<InspectorTab>("files");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [graphManual, setGraphManual] = useState<number | null>(null);
  const [centerH, setCenterH] = useState(800);
  const [termHint, setTermHint] = useState(() => !localStorage.getItem("canopy.termHintDone"));
  const center = useRef<HTMLDivElement>(null);
  const meta = lesson.view?.meta;
  // The terminal has its own size setting.
  const fontSize = codeFs(settings);
  const winW = useWindowWidth();
  const lessonCollapsed = panes.lessonCollapsed || winW < 1100;

  useEffect(() => {
    localStorage.setItem("canopy.panes2", JSON.stringify(panes));
  }, [panes]);

  // Track the centre column height (the graph may take up to 45% of it).
  useEffect(() => {
    const el = center.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCenterH(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The first-command hint goes away once the learner has run a command.
  useEffect(() => {
    if (termHint && (lesson.update?.commands ?? 0) > 0) {
      localStorage.setItem("canopy.termHintDone", "1");
      setTermHint(false);
    }
  }, [lesson.update?.commands, termHint]);

  // Open the lesson (and its shell). Re-runs on lesson change.
  useEffect(() => {
    dispatch(lessonActions.lessonOpening({ id: lessonId, reset: false }));
    setReset(false);
    setOpenFile(null);
    setGraphManual(null);
    api.getLesson(lessonId).then(
      (v) => {
        dispatch(lessonActions.lessonLoaded(v));
        if (v.meta.tools.length > 0) {
          api.toolCheck(v.meta.tools).then((found) => dispatch(lessonActions.setMissingTools(v.meta.tools.filter((t) => !found[t]))));
        }
        // The drawer opens by itself only in lessons that use it.
        const wantsGit = v.meta.panels.includes("inside-git");
        setTab(wantsGit ? "inside-git" : "files");
        setDrawerOpen(wantsGit || v.meta.panels.includes("files"));
      },
      (e) => dispatch(lessonActions.lessonFailed(String(e))),
    );
  }, [lessonId, dispatch]);

  const doReset = useCallback(() => {
    setConfirmReset(false);
    lessonTabMemory.delete(lessonId);
    setOpenFile(null);
    setReset(true);
    dispatch(lessonActions.lessonOpening({ id: lessonId, reset: true }));
    api.getLesson(lessonId).then((v) => dispatch(lessonActions.lessonLoaded({ ...v, answers: {} })));
  }, [dispatch, lessonId]);

  paneFocus.toggleDrawer = () => setDrawerOpen((o) => !o);

  // Keyboard: Alt+Shift+R reset, Alt+[ lesson panel, Alt+H hint, Alt+G follow terminal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && (e.key === "R" || e.key === "r")) {
        e.preventDefault();
        setConfirmReset(true);
      } else if (e.altKey && e.key === "[") {
        e.preventDefault();
        setPanes((p) => ({ ...p, lessonCollapsed: !p.lessonCollapsed }));
      } else if (e.altKey && e.key === "]") {
        e.preventDefault();
        setPanes((p) => ({ ...p, graphCollapsed: !p.graphCollapsed }));
      } else if (e.altKey && (e.key === "h" || e.key === "H")) {
        e.preventDefault();
        // Reveal without taking focus: a learner asking while typing keeps typing.
        dispatch(lessonActions.hintKey());
      } else if (e.altKey && (e.key === "g" || e.key === "G")) {
        e.preventDefault();
        dispatch(lessonActions.pinRepo(null));
      } else if (e.key === "Escape" && drawerOpen && document.activeElement?.closest("[data-pane=inspector]")) {
        setDrawerOpen(false);
        paneFocus.terminal?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch, drawerOpen]);

  const tabs: InspectorTab[] = ["files", ...(meta?.panels.includes("inside-git") ? (["inside-git"] as InspectorTab[]) : [])];
  const showGraph = meta ? meta.repo !== null || meta.repos.length > 0 : true;
  const showAreas = Boolean(meta?.panels.includes("three-areas"));
  const editorMode = openFile !== null;
  const leftFolder = lesson.update !== null && lesson.update.cwd === null;
  const lessonWidth = panes.lessonPx ? `${panes.lessonPx}px` : "clamp(360px, 28vw, 512px)";
  const drawerWidth = editorMode ? "min(50%, 720px)" : panes.drawerPx ? `${panes.drawerPx}px` : "clamp(320px, 24vw, 416px)";
  const openInDrawer = (f: OpenFile | null) => {
    setOpenFile(f);
    if (f) {
      setTab("files");
      setDrawerOpen(true);
    }
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Lesson panel */}
      {lessonCollapsed ? (
        <Rail label={meta?.title ?? "Lesson"} side="left" onOpen={() => setPanes((p) => ({ ...p, lessonCollapsed: false }))} chip={goalChip(lesson.update)} />
      ) : (
        <>
          <section role="region" aria-label="Lesson" data-pane="lesson" tabIndex={-1} className="flex min-h-0 shrink-0 flex-col border-r border-edge bg-surface" style={{ width: lessonWidth }}>
            {lesson.status === "error" ? (
              <div className="p-5">
                <Banner
                  tone="danger"
                  title="The lesson could not be set up."
                  actions={
                    <Button variant="danger-ghost" onClick={doReset}>
                      Reset lesson
                    </Button>
                  }
                >
                  Its setup script stopped with an error. Try Reset lesson.
                  <details className="mt-1 text-xs text-fg-2">
                    <summary className="cursor-pointer">Details</summary>
                    <pre className="selectable mt-1 whitespace-pre-wrap">{lesson.error}</pre>
                  </details>
                </Banner>
              </div>
            ) : (
              <LessonPanel
                onReset={() => setConfirmReset(true)}
                onViewScript={(path, source) => openInDrawer({ path, readOnly: true, content: source, title: `${path} · read-only` })}
                onCollapse={() => setPanes((p) => ({ ...p, lessonCollapsed: true }))}
              />
            )}
          </section>
          <Resizer
            orientation="vertical"
            measure={() => document.querySelector<HTMLElement>("[data-pane=lesson]")?.offsetWidth ?? 400}
            onSize={(px) => setPanes((p) => ({ ...p, lessonPx: clamp(px, 320, 576) }))}
            onReset={() => setPanes((p) => ({ ...p, lessonPx: null }))}
          />
        </>
      )}

      {/* Centre column: graph, three-area strip (when taught), terminal */}
      <div ref={center} className="relative flex min-h-0 min-w-[560px] flex-1 flex-col">
        {/* git's editor (commit message, rebase todo) slides over the top of the centre column. */}
        {lesson.editor && (
          <div className="absolute inset-x-0 top-0 z-20" style={{ height: "max(40%, 280px)" }}>
            <EditorSheet request={lesson.editor} onDone={() => paneFocus.terminal?.()} />
          </div>
        )}
        {showGraph && (
          <GraphPane
            showIds={settings.graphIds === "1"}
            maxHeight={centerH * 0.45}
            manualHeight={graphManual}
            collapsed={panes.graphCollapsed}
            onToggleCollapsed={() => setPanes((p) => ({ ...p, graphCollapsed: !p.graphCollapsed }))}
          />
        )}
        {showGraph && !panes.graphCollapsed && (
          <Resizer
            orientation="horizontal"
            measure={() => document.querySelector<HTMLElement>("[data-pane=graph]")?.offsetHeight ?? 200}
            onSize={(px) => setGraphManual(clamp(px, 120, centerH - 220))}
            onReset={() => setGraphManual(null)}
          />
        )}
        {showAreas && <AreasStrip onOpenFile={openInDrawer} />}
        <section role="region" aria-label="Terminal" data-pane="terminal" tabIndex={-1} className="flex min-h-[180px] flex-1 flex-col border-t border-edge">
          <PaneHeader label="Terminal" context={lesson.update?.cwd === null ? "outside the learning folder" : lesson.update?.cwd ? `in ${lesson.update.cwd}` : undefined}>
            <Button variant="ghost" size="sm" icon={PanelRight} onClick={() => setDrawerOpen((o) => !o)} aria-pressed={drawerOpen} title="Files (Alt+4)">
              Files
            </Button>
            <Button variant="ghost" size="sm" onClick={() => paneFocus.clearTerminal?.()}>
              Clear
            </Button>
          </PaneHeader>
          {termHint && (
            <div className="flex h-8 shrink-0 items-center border-b border-edge px-3 text-xs text-fg-2">
              <span className="truncate">Type commands here and press Enter. Alt+1–4 or F6 moves to the other panes.</span>
            </div>
          )}
          {leftFolder && (
            <Banner
              tone="warning"
              title="You left the learning folder."
              className="mx-3 mt-2"
              actions={
                <Button size="sm" onClick={() => api.terminalGoHome().then(() => paneFocus.terminal?.())}>
                  Go back
                </Button>
              }
            >
              The graph and goals update only inside it.
            </Banner>
          )}
          <div className="relative min-h-0 flex-1">
            {/* setup.sh can take a few seconds: show where the terminal will be. */}
            {lesson.status === "starting" && (
              <div className="absolute inset-0 z-10 bg-term-bg px-3 py-3">
                <div className="mb-3 text-xs text-fg-3">Setting up the lesson…</div>
                <Skeleton label="Setting up the lesson" lines={[38, 56, 30]} />
              </div>
            )}
            {/* Only once the store has switched to this lesson: rendering with the
                previous lesson's generation would start the shell twice. */}
            {lesson.status !== "idle" && lesson.id === lessonId && (
              <Terminal
                key={`${lessonId}:${lesson.generation}`}
                lessonId={lessonId}
                reset={reset}
                generation={lesson.generation}
                fontSize={fontSize}
                onStarted={() => {
                  dispatch(lessonActions.lessonStarted());
                  // Beginners should be able to type straight away.
                  paneFocus.terminal?.();
                }}
                onError={(m) => dispatch(lessonActions.lessonFailed(m))}
                registerFocus={(f, clear) => {
                  paneFocus.terminal = f;
                  paneFocus.clearTerminal = clear;
                }}
              />
            )}
          </div>
        </section>
      </div>

      {/* Drawer: files (and "Inside .git" in the lessons about it); closed by default. */}
      {drawerOpen && (
        <>
          <Resizer
            orientation="vertical"
            reverse
            measure={() => document.querySelector<HTMLElement>("[data-pane=inspector]")?.offsetWidth ?? 360}
            onSize={(px) => setPanes((p) => ({ ...p, drawerPx: clamp(px, 288, 640) }))}
            onReset={() => setPanes((p) => ({ ...p, drawerPx: null }))}
          />
          <div className="min-h-0 shrink-0 border-l border-edge" style={{ width: drawerWidth }}>
            <Inspector
              tabs={tabs}
              tab={tab}
              onTab={setTab}
              openFile={openFile}
              onOpenFile={openInDrawer}
              onCollapse={() => {
                setDrawerOpen(false);
                paneFocus.terminal?.();
              }}
            />
          </div>
        </>
      )}

      {confirmReset && (
        <Dialog
          title="Reset this lesson?"
          onClose={() => setConfirmReset(false)}
          actions={
            <>
              <Button variant="ghost" data-autofocus onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={doReset}>
                Reset lesson
              </Button>
            </>
          }
        >
          Canopy deletes the lesson folder and builds it again from the start. Your progress in other lessons is not affected. Leaving a lesson never does this; only Reset does.
        </Dialog>
      )}
    </div>
  );
}

function goalChip(update: { goals: { passed: boolean }[] } | null) {
  if (!update) return undefined;
  return `${update.goals.filter((g) => g.passed).length}/${update.goals.length}`;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function Rail({ label, side, onOpen, chip }: { label: string; side: "left" | "right"; onOpen: () => void; chip?: ReactNode }) {
  return (
    <button
      onClick={onOpen}
      aria-label={`Expand ${label}`}
      className={`flex w-[var(--size-rail)] shrink-0 flex-col items-center gap-3 bg-surface py-2 text-fg-2 hover:bg-sunken ${side === "left" ? "border-r" : "border-l"} border-edge`}
    >
      {side === "left" ? <PanelLeftOpen size={16} /> : <PanelRightOpen size={16} />}
      <span className="max-h-64 truncate text-xs [writing-mode:vertical-rl]">{label}</span>
      {chip && <span className="rounded-sm bg-sunken px-1 font-mono text-2xs">{chip}</span>}
    </button>
  );
}

/**
 * Drag handle between panes. The pane is measured once when the drag starts
 * and sized from the total pointer movement, at most once per frame, so the
 * size never lags behind the pointer. `reverse` is for panes on the right.
 */
function Resizer({
  orientation,
  measure,
  onSize,
  onReset,
  reverse,
}: {
  orientation: "vertical" | "horizontal";
  measure: () => number;
  onSize: (px: number) => void;
  onReset: () => void;
  reverse?: boolean;
}) {
  const vertical = orientation === "vertical";
  const sign = reverse ? -1 : 1;
  return (
    <div
      role="separator"
      aria-orientation={vertical ? "vertical" : "horizontal"}
      tabIndex={0}
      onDoubleClick={onReset}
      onKeyDown={(e) => {
        const step = (e.shiftKey ? 32 : 8) * sign;
        const grow: Record<string, number> = vertical ? { ArrowRight: step, ArrowLeft: -step } : { ArrowDown: step, ArrowUp: -step };
        const d = grow[e.key];
        if (d !== undefined) {
          e.preventDefault();
          onSize(measure() + d);
        }
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        const handle = e.currentTarget;
        handle.setPointerCapture(e.pointerId);
        const base = measure();
        const origin = vertical ? e.clientX : e.clientY;
        let frame = 0;
        let latest = origin;
        document.documentElement.dataset.resizing = "";
        const move = (ev: PointerEvent) => {
          latest = vertical ? ev.clientX : ev.clientY;
          if (!frame) {
            frame = requestAnimationFrame(() => {
              frame = 0;
              onSize(base + (latest - origin) * sign);
            });
          }
        };
        const up = () => {
          cancelAnimationFrame(frame);
          onSize(base + (latest - origin) * sign);
          delete document.documentElement.dataset.resizing;
          handle.removeEventListener("pointermove", move);
          handle.removeEventListener("pointerup", up);
          handle.removeEventListener("pointercancel", up);
        };
        handle.addEventListener("pointermove", move);
        handle.addEventListener("pointerup", up);
        handle.addEventListener("pointercancel", up);
      }}
      className={`group relative z-10 shrink-0 touch-none ${vertical ? "-mx-[5px] w-[10px] cursor-col-resize" : "-my-[5px] h-[10px] cursor-row-resize"}`}
    >
      <div className={`absolute bg-transparent group-hover:bg-accent group-focus-visible:bg-accent group-active:bg-accent ${vertical ? "inset-y-0 left-[4px] w-[2px]" : "inset-x-0 top-[4px] h-[2px]"}`} />
    </div>
  );
}

export function useLessonNavigation() {
  const dispatch = useAppDispatch();
  return (id: string) => dispatch(go({ kind: "lesson", lesson: id }));
}
