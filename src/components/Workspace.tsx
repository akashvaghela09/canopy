// Lesson workspace: lesson panel | graph over terminal | inspector
// (DESIGN.md section 4.1).

import { ChevronLeft, ChevronRight, Keyboard, Minus, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "../api";
import { appActions, lessonActions, setSetting, useAppDispatch, useAppSelector } from "../store";
import { EditorSheet } from "./EditorSheet";
import { GraphPane, useActiveRepo } from "./GraphPane";
import { Inspector, type InspectorTab, type OpenFile } from "./Inspector";
import { LessonPanel } from "./LessonPanel";
import { Terminal } from "./Terminal";
import { Banner, Button, Dialog, IconButton, PaneHeader } from "./ui";

type Panes = {
  lessonW: number;
  lessonCollapsed: boolean;
  inspectorW: number;
  inspectorCollapsed: boolean;
  graphRatio: number;
  graphCollapsed: boolean;
};

const DEFAULT_PANES: Panes = { lessonW: 360, lessonCollapsed: false, inspectorW: 320, inspectorCollapsed: false, graphRatio: 0.48, graphCollapsed: false };

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
  const fontSize = Number(settings.terminalFontSize ?? 13);
  // Small windows (DESIGN.md 4.1): narrower side panes, auto-collapse below 1100/960.
  const winW = useWindowWidth();
  const lessonW = winW < 1280 ? Math.min(panes.lessonW, 300) : panes.lessonW;
  const inspectorW = winW < 1280 ? Math.min(panes.inspectorW, 260) : panes.inspectorW;
  const lessonCollapsed = panes.lessonCollapsed || winW < 960;
  const inspectorCollapsed = panes.inspectorCollapsed || winW < 1100;

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
        setPanes((p) => ({ ...p, inspectorCollapsed: !p.inspectorCollapsed }));
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

  const tabs: InspectorTab[] = ["files", ...((meta?.panels ?? []).filter((p) => ["diff", "three-areas", "inside-git"].includes(p)) as InspectorTab[])];
  if (meta?.repo && !tabs.includes("diff")) tabs.splice(1, 0, "diff");
  const showGraph = meta ? meta.repo !== null || meta.repos.length > 0 : true;
  const editorMode = openFile !== null;

  const { cwdRepo } = useActiveRepo();
  const leftFolder = lesson.update !== null && lesson.update.cwd === null;

  return (
    <div className="flex h-full min-h-0">
      {/* Lesson panel */}
      {lessonCollapsed ? (
        <Rail label="Lesson" side="left" onOpen={() => setPanes((p) => ({ ...p, lessonCollapsed: false }))} chip={goalChip(lesson.update)} />
      ) : (
        <>
          <section role="region" aria-label="Lesson" data-pane="lesson" tabIndex={-1} className="flex min-h-0 shrink-0 flex-col border-r border-edge bg-surface" style={{ width: lessonW }}>
            <PaneHeader label="Lesson">
              <IconButton icon={ChevronLeft} label="Collapse lesson panel (Alt+[)" onClick={() => setPanes((p) => ({ ...p, lessonCollapsed: true }))} />
            </PaneHeader>
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
              <LessonPanel onReset={() => setConfirmReset(true)} onViewScript={(path, source) => setOpenFile({ path, readOnly: true, content: source, title: `${path} · read-only` })} />
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
        {showGraph && (
          <div className="relative min-h-0 shrink-0" style={{ height: panes.graphCollapsed ? 36 : `${panes.graphRatio * 100}%` }}>
            <GraphPane collapsed={panes.graphCollapsed} onToggle={() => setPanes((p) => ({ ...p, graphCollapsed: !p.graphCollapsed }))} showIds={settings.graphIds !== "0"} />
            {lesson.editor && <EditorSheet request={lesson.editor} onDone={() => paneFocus.terminal?.()} />}
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
          <PaneHeader label="Terminal" context={lesson.update?.cwd === null ? "outside the learning folder" : lesson.update?.cwd || (cwdRepo ? cwdRepo.label : ".")}>
            {meta?.flags.includes("destructive") && <span className="mr-2 rounded-sm border border-warning px-1.5 text-2xs text-fg-2">destructive lesson</span>}
            <IconButton icon={Minus} label="Smaller text (Ctrl+-)" onClick={() => dispatch(setSetting({ key: "terminalFontSize", value: String(Math.max(11, fontSize - 1)) }))} />
            <IconButton icon={Plus} label="Larger text (Ctrl+=)" onClick={() => dispatch(setSetting({ key: "terminalFontSize", value: String(Math.min(18, fontSize + 1)) }))} />
            <Button variant="ghost" size="sm" onClick={() => paneFocus.clearTerminal?.()}>
              Clear
            </Button>
            <IconButton icon={Keyboard} label="Alt+1–4 or F6 moves focus out of the terminal" />
          </PaneHeader>
          {termHint && (
            <div className="flex h-8 shrink-0 items-center gap-2 border-b border-edge px-3 text-xs text-fg-3">
              <span className="truncate">Tab completes commands here. Press Alt+1–4 or F6 to move to another pane.</span>
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
            <Banner tone="warning" title="You left the learning folder." className="mx-3 mt-2">
              Canopy only watches repos inside it. The graph and goals will not update until you go back.
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
                onStarted={() => dispatch(lessonActions.lessonStarted())}
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
        <Rail label="Files" side="right" onOpen={() => setPanes((p) => ({ ...p, inspectorCollapsed: false }))} />
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
              onCollapse={() => setPanes((p) => ({ ...p, inspectorCollapsed: true }))}
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
      {side === "left" ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
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
  return (id: string) => dispatch(appActions.navigate({ kind: "lesson", lesson: id }));
}
