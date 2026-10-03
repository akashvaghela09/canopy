import { ChevronRight, X } from "lucide-react";
import { useEffect } from "react";
import { api, events } from "./api";
import { FirstRun, GitGate, Home, SectionView, TopBar } from "./components/screens";
import { Button, Dialog, IconButton, Segmented, Stepper, Switch, useFocusTrap } from "./components/ui";
import { LessonUpdates } from "./components/Updates";
import { paneFocus, Workspace } from "./components/Workspace";
import { isAppChord } from "./components/Terminal";
import { appActions, catalogActions, confirmLeave, go, leaveRisks, lessonActions, loadCatalog, resetProgress, setSetting, store, useAppDispatch, useAppSelector } from "./store";
import { neighbours } from "./store/progress";
import { applyMotion, applyTheme, CODE_DEFAULT, CODE_STEPS, codeFs, LESSON_DEFAULT, LESSON_STEPS, lessonFs, nearest, stepBy } from "./theme";
import { useRef, useState } from "react";

let booting = false;
const APP_VERSION = __APP_VERSION__;

// Short "Lesson text 16" pill after Ctrl+= / Ctrl+-.
let pillSetter: ((t: string | null) => void) | null = null;
let pillTimer: ReturnType<typeof setTimeout> | undefined;
function showSizePill(text: string) {
  pillSetter?.(text);
  clearTimeout(pillTimer);
  pillTimer = setTimeout(() => pillSetter?.(null), 1200);
}
function SizePill() {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    pillSetter = setText;
    return () => {
      pillSetter = null;
    };
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed top-14 right-4 z-50">
      {text && <div className="flex h-6 items-center rounded-md border border-edge-2 bg-raised px-2 text-xs text-fg-2">{text}</div>}
    </div>
  );
}

export default function App() {
  const [bootError, setBootError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const screen = useAppSelector((s) => s.app.screen);
  const settings = useAppSelector((s) => s.app.settings);
  const cat = useAppSelector((s) => s.catalog.data);

  // Boot: git gate, settings, catalog, first run. Guarded so StrictMode's
  // double effect run does not boot twice.
  useEffect(() => {
    if (screen.kind !== "loading" || booting) return;
    booting = true;
    (async () => {
      api.frontendLog("info", "boot: checking git");
      const git = await api.gitCheck();
      api.frontendLog("info", `boot: git ${git.version} ok=${git.ok}`);
      dispatch(appActions.setGit(git));
      if (!git.ok) return dispatch(appActions.navigate({ kind: "gate" }));
      const s = await api.getSettings();
      dispatch(appActions.setSettings(s));
      api.frontendLog("info", "boot: loading lessons");
      await dispatch(loadCatalog()).unwrap();
      api.frontendLog("info", "boot: ready");
      dispatch(appActions.navigate(s.firstRunDone ? { kind: "home" } : { kind: "firstRun" }));
    })()
      .finally(() => {
        booting = false;
      })
      .catch((e) => {
        console.error(e);
        api.frontendLog("error", `boot failed: ${String(e)}`);
        setBootError(String(e));
      });
  }, [screen.kind, dispatch]);

  useEffect(() => applyTheme(settings.theme), [settings.theme]);
  useEffect(() => applyMotion(settings.motion), [settings.motion]);
  // Two text sizes: lesson content and terminal/editors. The root stays 16px.
  useEffect(() => {
    document.documentElement.style.setProperty("--lesson-fs", `${lessonFs(settings)}px`);
    document.documentElement.style.setProperty("--code-fs", `${codeFs(settings)}px`);
  }, [settings]);
  // One-time move from the old single "textSize" (a percentage) to the two settings.
  useEffect(() => {
    const old = Number(settings.textSize);
    if (!settings.textSize || settings.lessonText || settings.codeText) return;
    dispatch(setSetting({ key: "lessonText", value: String(nearest(LESSON_STEPS, (LESSON_DEFAULT * old) / 100)) }));
    dispatch(setSetting({ key: "codeText", value: String(nearest(CODE_STEPS, (CODE_DEFAULT * old) / 100)) }));
  }, [settings, dispatch]);

  // Backend events.
  useEffect(() => {
    const subs = [
      events.onLessonUpdate((u) => {
        dispatch(lessonActions.lessonUpdated(u));
        if (u.complete) dispatch(catalogActions.markComplete(u.lessonId));
      }),
      events.onEditorRequest((r) => dispatch(lessonActions.editorRequested(r))),
    ];
    return () => {
      subs.forEach((p) => p.then((un) => un()));
    };
  }, [dispatch]);

  // Closing the window asks first when work would be lost.
  useEffect(() => {
    if (!("__TAURI_INTERNALS__" in window) || (window as { __CANOPY_PREVIEW__?: boolean }).__CANOPY_PREVIEW__) return;
    let unlisten: (() => void) | undefined;
    import("@tauri-apps/api/window").then(({ getCurrentWindow }) =>
      getCurrentWindow()
        .onCloseRequested(async (e) => {
          const reasons = await leaveRisks(store.getState());
          if (reasons.length) {
            e.preventDefault();
            dispatch(appActions.askToLeave({ to: "quit", reasons, canSave: Boolean(store.getState().lesson.dirtyFile) }));
          }
        })
        .then((u) => (unlisten = u)),
    );
    return () => unlisten?.();
  }, [dispatch]);

  // Leaving the workspace stops the shell.
  useEffect(() => {
    if (screen.kind !== "lesson") {
      api.stopLesson().catch(() => {});
      dispatch(lessonActions.lessonClosed());
    }
  }, [screen.kind, dispatch]);

  // Global shortcuts (DESIGN.md 10.1). The terminal passes these through.
  useEffect(() => {
    const focusPane = (name: string) => {
      if (name === "terminal") return paneFocus.terminal?.();
      // Alt+4 opens or closes the Files drawer.
      if (name === "inspector") return paneFocus.toggleDrawer?.();
      const el = document.querySelector<HTMLElement>(`[data-pane="${name}"]`);
      el?.focus();
    };
    const order = ["lesson", "graph", "terminal", "inspector"];
    const onKey = (e: KeyboardEvent) => {
      if (!isAppChord(e)) return;
      if (e.altKey && /^[1-4]$/.test(e.key)) {
        e.preventDefault();
        focusPane(order[Number(e.key) - 1]);
      } else if (e.key === "F6") {
        e.preventDefault();
        const current = (document.activeElement?.closest("[data-pane]") as HTMLElement | null)?.dataset.pane;
        const i = current ? order.indexOf(current) : -1;
        focusPane(order[(i + (e.shiftKey ? order.length - 1 : 1)) % order.length]);
      } else if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight") && screen.kind === "lesson" && cat) {
        e.preventDefault();
        const nb = neighbours(cat, screen.lesson);
        const to = e.key === "ArrowLeft" ? nb.prev : nb.next;
        if (to) dispatch(go({ kind: "lesson", lesson: to.id }));
      } else if (e.altKey && e.key === "Home") {
        e.preventDefault();
        dispatch(go({ kind: "home" }));
      } else if (e.ctrlKey && e.key === ",") {
        e.preventDefault();
        dispatch(appActions.openSettings(true));
      } else if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        dispatch(appActions.openShortcuts(true));
      } else if (e.ctrlKey && (e.key === "=" || e.key === "-" || e.key === "0")) {
        // Change the text size of the surface being worked in.
        e.preventDefault();
        const el = document.activeElement;
        const code = Boolean(el?.closest("[data-pane=terminal], .cm-editor, .editor-sheet"));
        const [key, steps, dflt, cur, name] = code
          ? (["codeText", CODE_STEPS, CODE_DEFAULT, codeFs(settings), "Terminal text"] as const)
          : (["lessonText", LESSON_STEPS, LESSON_DEFAULT, lessonFs(settings), "Lesson text"] as const);
        const next = e.key === "0" ? dflt : stepBy([...steps], cur, e.key === "=" ? 1 : -1);
        dispatch(setSetting({ key, value: String(next) }));
        showSizePill(`${name} ${next}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch, screen, cat, settings]);

  if (bootError) {
    return (
      <main className="flex h-full items-center justify-center bg-bg p-8">
        <div className="max-w-xl">
          <h1 className="text-xl font-semibold">Canopy could not start.</h1>
          <pre className="selectable mt-3 rounded-md bg-sunken p-3 font-mono text-xs whitespace-pre-wrap">{bootError}</pre>
          <Button className="mt-4" onClick={() => location.reload()}>
            Try again
          </Button>
        </div>
      </main>
    );
  }
  if (screen.kind === "loading") return <div className="h-full bg-bg" />;
  if (screen.kind === "gate") return <GitGate />;
  if (screen.kind === "firstRun") return <FirstRun />;

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="min-h-0 flex-1">
        {screen.kind === "home" && <Home />}
        {screen.kind === "section" && <SectionView sectionId={screen.section} />}
        {screen.kind === "lesson" && <Workspace lessonId={screen.lesson} />}
      </div>
      <SizePill />
      <SettingsSheet />
      <LeaveDialog />
      <Shortcuts />
      <Toasts />
    </div>
  );
}

function Toasts() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((s) => s.app.toasts);
  useEffect(() => {
    const timers = toasts.filter((t) => t.kind !== "danger").map((t) => setTimeout(() => dispatch(appActions.dismissToast(t.id)), 5000));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dispatch]);
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-40 flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === "danger" ? "alert" : "status"}
          className="toast pointer-events-auto flex gap-2 rounded-md border border-edge-2 bg-raised p-3 text-sm shadow-[0_4px_12px_oklch(0%_0_0/0.12)] dark:shadow-[0_4px_12px_oklch(0%_0_0/0.4)]"
        >
          <div className="min-w-0 flex-1">
            <div className={t.kind === "danger" ? "font-medium" : ""}>{t.text}</div>
            {t.detail && (
              <details className="mt-1 text-xs text-fg-2">
                <summary className="cursor-pointer">Show output</summary>
                <pre className="selectable mt-1 max-h-40 overflow-auto whitespace-pre-wrap">{t.detail}</pre>
              </details>
            )}
          </div>
          <IconButton icon={X} label="Dismiss" onClick={() => dispatch(appActions.dismissToast(t.id))} />
        </div>
      ))}
    </div>
  );
}

function SettingsSheet() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.app.settingsOpen);
  const settings = useAppSelector((s) => s.app.settings);
  const git = useAppSelector((s) => s.app.git);
  const cat = useAppSelector((s) => s.catalog.data);
  const [confirmAll, setConfirmAll] = useState(false);
  const sheet = useRef<HTMLElement>(null);
  useFocusTrap(sheet);
  useEffect(() => {
    if (!open) return;
    sheet.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dispatch(appActions.openSettings(false));
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dispatch]);
  if (!open) return null;
  const set = (key: string, value: string) => dispatch(setSetting({ key, value }));
  const done = cat ? Object.keys(cat.completed).length : 0;
  return (
    // A light scrim keeps the lesson and terminal readable while sizes change.
    <div className="fixed inset-0 z-30 flex justify-end bg-black/15 dark:bg-black/35" onMouseDown={() => dispatch(appActions.openSettings(false))}>
      <aside
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="flex h-full w-[440px] flex-col border-l border-edge-2 bg-bg max-[1279px]:w-[400px]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex h-[52px] shrink-0 items-center border-b border-edge px-5">
          <h2 className="text-base font-semibold">Settings</h2>
          <IconButton icon={X} label="Close settings (Esc)" className="ml-auto" size={28} onClick={() => dispatch(appActions.openSettings(false))} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-2 pb-6">
          <SettingsGroup title="Appearance">
            <Row label="Theme">
              <Segmented
                label="Theme"
                value={(settings.theme ?? "system") as "system" | "light" | "dark"}
                options={[
                  { value: "system", label: "System" },
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
                onChange={(v) => set("theme", v)}
              />
            </Row>
            <Row label="Reduce motion" description="Canopy already follows your system setting. Turn on to always reduce it." onRowClick={() => set("motion", settings.motion === "reduce" ? "system" : "reduce")}>
              <Switch label="Reduce motion" checked={settings.motion === "reduce"} onChange={(v) => set("motion", v ? "reduce" : "system")} />
            </Row>
          </SettingsGroup>
          <SettingsGroup title="Text size" caption="Ctrl+= and Ctrl+- change the one you are working in.">
            <Row label="Lessons" description="Lesson text, questions and goals">
              <Stepper label="Lesson text" value={lessonFs(settings)} steps={LESSON_STEPS} dflt={LESSON_DEFAULT} onChange={(v) => set("lessonText", String(v))} />
            </Row>
            <Row label="Terminal and editors" description="Terminal, commit messages and files">
              <Stepper label="Terminal text" value={codeFs(settings)} steps={CODE_STEPS} dflt={CODE_DEFAULT} onChange={(v) => set("codeText", String(v))} />
            </Row>
          </SettingsGroup>
          <SettingsGroup title="Graph">
            <Row label="Show commit ids" description="Instead of commit messages under each commit" onRowClick={() => set("graphIds", settings.graphIds === "1" ? "0" : "1")}>
              <Switch label="Show commit ids" checked={settings.graphIds === "1"} onChange={(v) => set("graphIds", v ? "1" : "0")} />
            </Row>
            <Row label="Graph as a text list" description="Easier with a screen reader" onRowClick={() => set("graphText", settings.graphText === "1" ? "0" : "1")}>
              <Switch label="Graph as a text list" checked={settings.graphText === "1"} onChange={(v) => set("graphText", v ? "1" : "0")} />
            </Row>
          </SettingsGroup>
          <SettingsGroup title="Lessons">
            <LessonUpdates />
            <Row label="Reset all progress" description={done === 0 ? "Nothing to reset" : done === 1 ? "Marks your 1 completed lesson as not done" : `Marks all ${done} completed lessons as not done`}>
              <Button disabled={done === 0} onClick={() => setConfirmAll(true)}>
                Reset…
              </Button>
            </Row>
          </SettingsGroup>
          <SettingsGroup title="Help">
            <button className="flex min-h-12 w-full items-center gap-4 px-3.5 py-2.5 text-left hover:bg-sunken" onClick={() => dispatch(appActions.openShortcuts(true))}>
              <span className="flex-1 text-[0.84375rem] font-medium">Keyboard shortcuts</span>
              <span className="font-mono text-xs text-fg-3">Ctrl+/</span>
              <ChevronRight size={14} className="text-fg-3" />
            </button>
          </SettingsGroup>
          <footer className="mt-6 text-center text-xs leading-5 text-fg-3">
            Canopy {APP_VERSION} · git {git?.version} · lesson format {cat?.manifest.formatVersion}
            <br />
            Inter and JetBrains Mono (OFL) · Lucide icons (ISC)
          </footer>
        </div>
      </aside>
      {confirmAll && (
        <Dialog
          title="Reset all progress?"
          onClose={() => setConfirmAll(false)}
          actions={
            <>
              <Button variant="ghost" data-autofocus onClick={() => setConfirmAll(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setConfirmAll(false);
                  dispatch(resetProgress(null));
                }}
              >
                Reset all progress
              </Button>
            </>
          }
        >
          {done === 1 ? "Your 1 completed lesson" : `All ${done} completed lessons`} will be marked as not complete. This cannot be undone.
        </Dialog>
      )}
    </div>
  );
}

function SettingsGroup({ title, caption, children }: { title: string; caption?: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mx-1 mb-2 text-[0.8125rem] font-semibold text-fg-2">{title}</h3>
      <div className="divide-y divide-edge overflow-hidden rounded-lg border border-edge bg-surface">{children}</div>
      {caption && <p className="mx-1 mt-1.5 text-xs text-fg-3">{caption}</p>}
    </section>
  );
}

/** One settings row: label and description left, control right. */
export function Row({ label, description, children, onRowClick }: { label: string; description?: React.ReactNode; children: React.ReactNode; onRowClick?: () => void }) {
  return (
    <div className={`flex min-h-12 items-center gap-4 px-3.5 py-2.5 ${onRowClick ? "cursor-pointer" : ""}`} onClick={(e) => onRowClick && !(e.target as HTMLElement).closest("button") && onRowClick()}>
      <div className="min-w-0 flex-1">
        <div className="text-[0.84375rem] leading-5 font-medium">{label}</div>
        {description && <div className="mt-0.5 text-xs leading-4 text-fg-3">{description}</div>}
      </div>
      {children}
    </div>
  );
}

const SHORTCUTS: [string, string][] = [
  ["Alt+1 / 2 / 3", "Focus Lesson / Graph / Terminal"],
  ["Alt+4", "Open or close Files"],
  ["F6 / Shift+F6", "Cycle focus between panes"],
  ["Alt+← / Alt+→", "Previous / next lesson"],
  ["Alt+L", "Lessons in this section"],
  ["Alt+Home", "Home"],
  ["Alt+Shift+R", "Reset lesson"],
  ["Alt+H", "Show next hint"],
  ["Alt+G", "Graph follows the terminal"],
  ["Alt+[", "Hide or show the lesson panel"],
  ["Ctrl+,", "Settings"],
  ["Ctrl+/", "Keyboard shortcuts"],
  ["Ctrl+Shift+C / V", "Copy / paste in the terminal"],
  ["Ctrl+= / Ctrl+- / Ctrl+0", "Text size of the lesson or terminal, whichever you are in"],
  ["Ctrl+Enter", "Save and continue (editor sheet)"],
];

function Shortcuts() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.app.shortcutsOpen);
  if (!open) return null;
  return (
    <Dialog
      title="Keyboard shortcuts"
      width={560}
      onClose={() => dispatch(appActions.openShortcuts(false))}
      actions={
        <Button variant="primary" data-autofocus onClick={() => dispatch(appActions.openShortcuts(false))}>
          Close
        </Button>
      }
    >
      <table className="w-full text-sm">
        <tbody>
          {SHORTCUTS.map(([k, v]) => (
            <tr key={k}>
              <td className="py-1 pr-4 font-mono text-xs whitespace-nowrap text-fg">{k}</td>
              <td className="py-1">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}

function LeaveDialog() {
  const dispatch = useAppDispatch();
  const pending = useAppSelector((s) => s.app.pendingNav);
  if (!pending) return null;
  const quitting = pending.to === "quit";
  const cancel = () => dispatch(appActions.askToLeave(null));
  return (
    <Dialog
      title={quitting ? "Quit Canopy?" : "Leave this lesson?"}
      onClose={cancel}
      actions={
        <>
          <Button variant="ghost" data-autofocus={!pending.canSave || undefined} onClick={cancel}>
            Cancel
          </Button>
          <Button variant={pending.canSave ? "secondary" : "primary"} onClick={() => dispatch(confirmLeave(false))}>
            {quitting ? "Quit" : "Leave"}
          </Button>
          {pending.canSave && (
            <Button variant="primary" data-autofocus onClick={() => dispatch(confirmLeave(true))}>
              {quitting ? "Save and quit" : "Save and leave"}
            </Button>
          )}
        </>
      }
    >
      {pending.reasons.map((r) => (
        <p key={r}>{r}</p>
      ))}
      <p className="mt-3">Everything else is kept: your files, answers and progress. You can come back to this lesson any time.</p>
    </Dialog>
  );
}
