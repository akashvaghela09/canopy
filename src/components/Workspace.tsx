// Lesson workspace: lesson panel | graph over terminal | inspector
// (DESIGN.md section 4.1).

import { PanelLeftOpen, PanelRightOpen, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "../api";
import { go, lessonActions, useAppDispatch, useAppSelector } from "../store";
import { EditorSheet } from "./EditorSheet";
import { GraphPane } from "./GraphPane";
import { Inspector, type InspectorTab, type OpenFile } from "./Inspector";
import { LessonPanel } from "./LessonPanel";
import { Terminal } from "./Terminal";
import { textScale } from "../theme";
import { Banner, Button, Dialog, IconButton, PaneHeader } from "./ui";

type Panes = {
  lessonW: number;
  lessonCollapsed: boolean;
  inspectorW: number;
  inspectorCollapsed: boolean;
  graphRatio: number;
  graphCollapsed: boolean;
  /** Below 1280px the inspector starts collapsed unless opened there. */
  inspectorOpenSmall: boolean;
};

const DEFAULT_PANES: Panes = { lessonW: 360, lessonCollapsed: false, inspectorW: 320, inspectorCollapsed: false, graphRatio: 0.48, graphCollapsed: false, inspectorOpenSmall: false };

function loadPanes(): Panes {
  try {
    return { ...DEFAULT_PANES, ...JSON.parse(localStorage.getItem("canopy.panes") ?? "{}") };
  } catch {
    return DEFAULT_PANES;
  }
}

/** Focus helpers shared with the global keyboard handler. */
export const paneFocus: { terminal?: () => void; clearTerminal?: () => void } = {};

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
  const [termHint, setTermHint] = useState(() => !localStorage.getItem("canopy.termHintDone"));
  const center = useRef<HTMLDivElement>(null);
  const meta = lesson.view?.meta;
  // The terminal follows the one Text size setting (13px at Default).
  const fontSize = Math.round((13 * textScale(settings)) / 100);
  // Small windows (DESIGN.md 4.1): narrower side panes, auto-collapse below 1100/960.
  const winW = useWindowWidth();
  const lessonW = winW < 1280 ? Math.min(panes.lessonW, 300) : panes.lessonW;
  const inspectorW = winW < 1280 ? Math.min(panes.inspectorW, 260) : panes.inspectorW;
  const lessonCollapsed = panes.lessonCollapsed || winW < 960;
  const small = winW < 1280;
  const inspectorCollapsed = small ? !panes.inspectorOpenSmall : panes.inspectorCollapsed;
  const setInspectorOpen = (open: boolean) =>
    setPanes((p) => (small ? { ...p, inspectorOpenSmall: open } : { ...p, inspectorCollapsed: !open }));

  useEffect(() => {
    localStorage.setItem("canopy.panes", JSON.stringify(panes));
  }, [panes]);

  // Open the lesson (and its shell). Re-runs on lesson change.
  useEffect(() => {
    dispatch(lessonActions.lessonOpening({ id: lessonId, reset: false }));
    setReset(false);
    setOpenFile(null);
    api.getLesson(lessonId).then(
      (v) => {
        dispatch(lessonActions.lessonLoaded(v));
        if (v.meta.tools.length > 0) {
          api.toolCheck(v.meta.tools).then((found) => dispatch(lessonActions.setMissingTools(v.meta.tools.filter((t) => !found[t]))));
        }
        setTab((v.meta.panels.filter((p) => ["diff", "three-areas", "inside-git"].includes(p))[0] as InspectorTab) ?? "files");
      },
      (e) => dispatch(lessonActions.lessonFailed(String(e))),
    );
  }, [lessonId, dispatch]);

  const doReset = useCallback(() => {
    setConfirmReset(false);
    setOpenFile(null);
    setReset(true);
    dispatch(lessonActions.lessonOpening({ id: lessonId, reset: true }));
    api.getLesson(lessonId).then((v) => dispatch(lessonActions.lessonLoaded({ ...v, answers: {} })));
  }, [dispatch, lessonId]);

  // Keyboard: Alt+Shift+R reset, Alt+[ / Alt+] collapse panes.
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
        setPanes((p) => (window.innerWidth < 1280 ? { ...p, inspectorOpenSmall: !p.inspectorOpenSmall } : { ...p, inspectorCollapsed: !p.inspectorCollapsed }));
      } else if (e.altKey && (e.key === "h" || e.key === "H")) {
        e.preventDefault();
        dispatch(lessonActions.showHint());
      } else if (e.altKey && (e.key === "g" || e.key === "G")) {
        e.preventDefault();
        dispatch(lessonActions.pinRepo(null));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]);

  // Fixed order; extra tabs only when the lesson uses them.
  const tabs: InspectorTab[] = ["files", ...(["diff", "three-areas", "inside-git"] as InspectorTab[]).filter((t) => meta?.panels.includes(t))];
  const showGraph = meta ? meta.repo !== null || meta.repos.length > 0 : true;
  const editorMode = openFile !== null;

  const leftFolder = lesson.update !== null && lesson.update.cwd === null;

  return (
    <div className="flex h-full min-h-0">
      {/* Lesson panel */}
      {lessonCollapsed ? (
        <Rail label="Lesson" side="left" onOpen={() => setPanes((p) => ({ ...p, lessonCollapsed: false }))} chip={goalChip(lesson.update)} />
      ) : (
        <>
          <section role="region" aria-label="Lesson" data-pane="lesson" tabIndex={-1} className="flex min-h-0 shrink-0 flex-col border-r border-edge bg-surface" style={{ width: lessonW }}>
            {lesson.status === "error" ? (
              <div className="p-4">
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
                onViewScript={(path, source) => setOpenFile({ path, readOnly: true, content: source, title: `${path} · read-only` })}
                onCollapse={() => setPanes((p) => ({ ...p, lessonCollapsed: true }))}
              />
            )}
          </section>
          <Resizer
            orientation="vertical"
            onDrag={(dx) => setPanes((p) => ({ ...p, lessonW: clamp(p.lessonW + dx, 300, 480) }))}
            onReset={() => setPanes((p) => ({ ...p, lessonW: DEFAULT_PANES.lessonW }))}
          />
        </>
      )}

      {/* Center column */}
      <div ref={center} className="relative flex min-h-0 min-w-[480px] flex-1 flex-col">
        {/* git's editor (commit message, rebase todo) covers the top of the centre column. */}
        {lesson.editor && (
          <div className="absolute inset-x-0 top-0 z-20" style={{ height: showGraph && !panes.graphCollapsed ? `${panes.graphRatio * 100}%` : "50%" }}>
            <EditorSheet request={lesson.editor} onDone={() => paneFocus.terminal?.()} />
          </div>
        )}
        {showGraph && (
          <div className="relative min-h-0 shrink-0" style={{ height: panes.graphCollapsed ? 36 : `${panes.graphRatio * 100}%` }}>
            <GraphPane collapsed={panes.graphCollapsed} onToggle={() => setPanes((p) => ({ ...p, graphCollapsed: !p.graphCollapsed }))} showIds={settings.graphIds === "1"} />
          </div>
        )}
        {showGraph && !panes.graphCollapsed && (
          <Resizer
            orientation="horizontal"
            onDrag={(_, dy) => {
              const h = center.current?.clientHeight ?? 1;
              setPanes((p) => ({ ...p, graphRatio: clamp(p.graphRatio + dy / h, 160 / h, 1 - 216 / h) }));
            }}
            onReset={() => setPanes((p) => ({ ...p, graphRatio: DEFAULT_PANES.graphRatio }))}
          />
        )}
        <section role="region" aria-label="Terminal" data-pane="terminal" tabIndex={-1} className="flex min-h-[180px] flex-1 flex-col border-t border-edge">
          <PaneHeader label="Terminal" context={lesson.update?.cwd === null ? "outside the learning folder" : lesson.update?.cwd ? `in ${lesson.update.cwd}` : undefined}>
            <Button variant="ghost" size="sm" onClick={() => paneFocus.clearTerminal?.()}>
              Clear
            </Button>
          </PaneHeader>
          {termHint && (
            <div className="flex h-8 shrink-0 items-center gap-2 border-b border-edge px-3 text-xs text-fg-2">
              <span className="truncate">Type commands here and press Enter. Alt+1–4 or F6 moves to the other panes.</span>
              <IconButton
                icon={X}
                label="Dismiss"
                className="ml-auto"
                onClick={() => {
                  localStorage.setItem("canopy.termHintDone", "1");
                  setTermHint(false);
                }}
              />
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
          <div className="min-h-0 flex-1">
            {lesson.status !== "idle" && (
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

      {/* Inspector */}
      {inspectorCollapsed ? (
        <Rail label="Files" side="right" onOpen={() => setInspectorOpen(true)} />
      ) : (
        <>
          <Resizer
            orientation="vertical"
            onDrag={(dx) => setPanes((p) => ({ ...p, inspectorW: clamp(p.inspectorW - dx, 260, 560) }))}
            onReset={() => setPanes((p) => ({ ...p, inspectorW: DEFAULT_PANES.inspectorW }))}
          />
          <div className="min-h-0 shrink-0 border-l border-edge transition-[width] duration-[var(--dur-slow)]" style={{ width: editorMode ? "min(50%, 720px)" : inspectorW }}>
            <Inspector
              tabs={tabs}
              tab={tab}
              onTab={setTab}
              openFile={openFile}
              onOpenFile={(f) => {
                setOpenFile(f);
                if (f) setTab("files");
              }}
              onCollapse={() => setInspectorOpen(false)}
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
          Canopy deletes the lesson folder and builds it again from the start. Your progress in other lessons is not affected.
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
      <span className="text-2xs font-semibold tracking-[0.06em] uppercase [writing-mode:vertical-rl]">{label}</span>
      {chip && <span className="rounded-sm bg-sunken px-1 font-mono text-2xs">{chip}</span>}
    </button>
  );
}

function Resizer({ orientation, onDrag, onReset }: { orientation: "vertical" | "horizontal"; onDrag: (dx: number, dy: number) => void; onReset: () => void }) {
  const vertical = orientation === "vertical";
  return (
    <div
      role="separator"
      aria-orientation={vertical ? "vertical" : "horizontal"}
      tabIndex={0}
      onDoubleClick={onReset}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 32 : 8;
        if (vertical && e.key === "ArrowLeft") onDrag(-step, 0);
        if (vertical && e.key === "ArrowRight") onDrag(step, 0);
        if (!vertical && e.key === "ArrowUp") onDrag(0, -step);
        if (!vertical && e.key === "ArrowDown") onDrag(0, step);
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        let x = e.clientX;
        let y = e.clientY;
        const move = (ev: PointerEvent) => {
          onDrag(ev.clientX - x, ev.clientY - y);
          x = ev.clientX;
          y = ev.clientY;
        };
        const up = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      }}
      className={`group relative z-10 shrink-0 ${vertical ? "-mx-[5px] w-[10px] cursor-col-resize" : "-my-[5px] h-[10px] cursor-row-resize"}`}
    >
      <div className={`absolute bg-transparent group-hover:bg-accent group-focus-visible:bg-accent ${vertical ? "inset-y-0 left-[4px] w-[2px]" : "inset-x-0 top-[4px] h-[2px]"}`} />
    </div>
  );
}

export function useLessonNavigation() {
  const dispatch = useAppDispatch();
  return (id: string) => dispatch(go({ kind: "lesson", lesson: id }));
}
