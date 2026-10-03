import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App";
import { appActions, store } from "./store";
import "./styles.css";
import "./components/lesson.css";

// Send uncaught errors to the backend so they show up in a terminal.
function report(level: string, message: string) {
  import("@tauri-apps/api/core")
    .then(({ invoke }) => invoke("frontend_log", { level, message }))
    .catch(() => {});
}
window.addEventListener("error", (e) => report("error", `${e.message} at ${e.filename}:${e.lineno}`));
window.addEventListener("unhandledrejection", (e) => report("error", `unhandled rejection: ${String(e.reason)}`));

async function boot() {
  report("info", `frontend loaded (${navigator.userAgent})`);
  // Load the bundled fonts first so xterm and the graph measure the right glyphs.
  await Promise.race([
    Promise.all(['13px "JetBrains Mono Variable"', '600 13px "JetBrains Mono Variable"', '14px "Inter Variable"'].map((f) => document.fonts.load(f))),
    new Promise((r) => setTimeout(r, 1500)),
  ]).catch(() => {});
  if (import.meta.env.DEV) {
    const { setupPreview } = await import("./dev/preview");
    if (await setupPreview()) {
      const screen = (window as { __canopyPreviewScreen?: string }).__canopyPreviewScreen;
      const lesson = new URLSearchParams(location.search).get("lesson") ?? "2.03";
      const section = Number(new URLSearchParams(location.search).get("section") ?? lesson.split(".")[0]);
      const unsubscribe = store.subscribe(() => {
        if (store.getState().app.screen.kind !== "home") return;
        unsubscribe();
        if (screen === "lesson") store.dispatch(appActions.navigate({ kind: "lesson", lesson }));
        if (screen === "section") store.dispatch(appActions.navigate({ kind: "section", section }));
        if (new URLSearchParams(location.search).get("settings")) store.dispatch(appActions.openSettings(true));
      });
    }
  }
  // CANOPY_SMOKE_LESSON=<id>: open a lesson, run `git status`, log what happens.
  import("@tauri-apps/api/core").then(async ({ invoke }) => {
    const id = await invoke<string | null>("smoke_lesson").catch(() => null);
    if (!id) return;
    const { listen } = await import("@tauri-apps/api/event");
    listen<{ goals: { passed: boolean }[]; commands: number; repos: { snapshot: unknown }[] }>("lesson-update", (e) =>
      report("info", `smoke: update commands=${e.payload.commands} goals=${e.payload.goals.filter((g) => g.passed).length}/${e.payload.goals.length} snapshots=${e.payload.repos.filter((r) => r.snapshot).length}`),
    );
    let navigated = false;
    let typed = false;
    store.subscribe(() => {
      const st = store.getState();
      if (!navigated && (st.app.screen.kind === "home" || st.app.screen.kind === "firstRun")) {
        navigated = true;
        store.dispatch(appActions.navigate({ kind: "lesson", lesson: id }));
      }
      if (!typed && st.lesson.status === "running") {
        typed = true;
        report("info", "smoke: lesson running, typing git status");
        setTimeout(() => invoke("terminal_write", { data: "git status\r" }), 500);
        setTimeout(() => invoke("terminal_write", { data: "git add todo.txt && git commit -qm \"Add list\"\r" }), 1500);
      }
    });
  });

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>,
  );
}
boot();
