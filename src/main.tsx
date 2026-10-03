import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App";
import { appActions, store } from "./store";
import "./styles.css";
import "./components/lesson.css";

async function boot() {
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
      });
    }
  }
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>,
  );
}
boot();
