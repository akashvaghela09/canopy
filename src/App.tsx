import { X } from "lucide-react";
import { useEffect } from "react";
import { api, events } from "./api";
import { FirstRun, GitGate, Home, SectionView, ThemeRadios, TopBar } from "./components/screens";
import { Button, Dialog, IconButton, useFocusTrap } from "./components/ui";
import { LessonUpdates } from "./components/Updates";
import { paneFocus, Workspace } from "./components/Workspace";
import { isAppChord } from "./components/Terminal";
import { appActions, catalogActions, confirmLeave, go, leaveRisks, lessonActions, loadCatalog, resetProgress, setSetting, store, useAppDispatch, useAppSelector } from "./store";
import { neighbours } from "./store/progress";
import { applyMotion, applyTheme, TEXT_SIZES, textScale } from "./theme";
import { useRef, useState } from "react";

let booting = false;

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
  useEffect(() => {
    document.documentElement.style.fontSize = `${textScale(settings)}%`;
  }, [settings]);

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
        e.preventDefault();
        const steps = TEXT_SIZES.map((t) => t.value);
        const cur = steps.indexOf(textScale(settings));
        const next = e.key === "0" ? 100 : steps[Math.min(steps.length - 1, Math.max(0, cur + (e.key === "=" ? 1 : -1)))];
        dispatch(setSetting({ key: "textSize", value: String(next) }));
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
    <div className="fixed inset-0 z-30 flex justify-end bg-black/40 dark:bg-black/60" onMouseDown={() => dispatch(appActions.openSettings(false))}>
      <aside ref={sheet} role="dialog" aria-modal="true" aria-label="Settings" className="flex h-full w-[480px] flex-col border-l border-edge-2 bg-raised" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex h-12 shrink-0 items-center border-b border-edge px-4">
          <h2 className="text-lg font-semibold">Settings</h2>
          <IconButton icon={X} label="Close settings" className="ml-auto" size={28} onClick={() => dispatch(appActions.openSettings(false))} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 text-sm">
          <SettingsGroup title="Appearance">
            <Row label="Theme">
              <ThemeRadios value={settings.theme ?? "system"} onChange={(v) => set("theme", v)} />
            </Row>
            <Row label="Text size">
              <select value={String(textScale(settings))} onChange={(e) => set("textSize", e.target.value)} className="h-7 rounded-sm border border-edge-2 bg-surface px-2" aria-describedby="text-size-note">
                {TEXT_SIZES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div id="text-size-note" className="mt-1 text-xs text-fg-3">
                Lessons, panels and the terminal. Ctrl+= and Ctrl+- also work.
              </div>
            </Row>
            <Row label="Reduce motion">
              <select value={settings.motion ?? "system"} onChange={(e) => set("motion", e.target.value)} className="h-7 rounded-sm border border-edge-2 bg-surface px-2">
                <option value="system">Follow system</option>
                <option value="reduce">Always</option>
              </select>
            </Row>
            <Row label="Graph">
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={settings.graphIds === "1"} onChange={(e) => set("graphIds", e.target.checked ? "1" : "0")} className="accent-[var(--color-accent)]" />
                  Show commit ids instead of messages
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={settings.graphText === "1"} onChange={(e) => set("graphText", e.target.checked ? "1" : "0")} className="accent-[var(--color-accent)]" />
                  Show the graph as a text list (screen readers)
                </label>
              </div>
            </Row>
          </SettingsGroup>
          <SettingsGroup title="Lessons">
            <LessonUpdates />
            <Row label="Progress">
              <Button variant="danger-ghost" disabled={done === 0} onClick={() => setConfirmAll(true)}>
                Reset all progress…
              </Button>
            </Row>
          </SettingsGroup>
          <SettingsGroup title="Help">
            <Row label="Keyboard">
              <Button variant="link" onClick={() => dispatch(appActions.openShortcuts(true))}>
                Keyboard shortcuts
              </Button>
            </Row>
          </SettingsGroup>
          <SettingsGroup title="About">
            <div className="text-fg-2">
              Canopy · git {git?.version}
              <br />
              Lesson format {cat?.manifest.formatVersion} · content {cat?.manifest.contentVersion}
              <br />
              Fonts: Inter, JetBrains Mono (OFL). Icons: Lucide (ISC).
            </div>
          </SettingsGroup>
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
          All {done} completed lessons will be marked as not complete. This cannot be undone.
        </Dialog>
      )}
    </div>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-2 text-2xs font-semibold tracking-[0.06em] text-fg-3 uppercase">{title}</h3>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
      <span className="text-fg-2">{label}</span>
      <div>{children}</div>
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
  ["Ctrl+= / Ctrl+- / Ctrl+0", "Text size (bigger / smaller / default)"],
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
