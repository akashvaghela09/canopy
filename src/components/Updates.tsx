// Settings → Lessons → Lesson content (DESIGN.md 3.7). Manual only: nothing
// touches the network until the learner presses the button.

import { CheckCircle2, Download, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { api, onUpdateProgress, type UpdateFeed } from "../api";
import { appActions, loadCatalog, useAppDispatch, useAppSelector } from "../store";
import { Banner, Button, ProgressBar } from "./ui";

type State =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "notConfigured" }
  | { kind: "upToDate" }
  | { kind: "available"; feed: UpdateFeed }
  | { kind: "downloading"; feed: UpdateFeed; done: number; total: number }
  | { kind: "installing"; feed: UpdateFeed }
  | { kind: "installed"; version: string; openLessonChanged: boolean }
  | { kind: "failed"; message: string; detail: string }
  | { kind: "needsNewerApp"; feed: UpdateFeed };

const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`;

export function LessonUpdates() {
  const dispatch = useAppDispatch();
  const installed = useAppSelector((s) => s.catalog.data?.manifest.contentVersion ?? "");
  const lastChecked = useAppSelector((s) => s.app.settings.updatesCheckedAt);
  const [state, setState] = useState<State>({ kind: "idle" });

  useEffect(() => {
    const un = onUpdateProgress((p) => setState((s) => (s.kind === "downloading" ? { ...s, done: p.done, total: p.total } : s)));
    return () => {
      un.then((f) => f());
    };
  }, []);

  const check = async () => {
    setState({ kind: "checking" });
    try {
      const r = await api.checkUpdates();
      const now = String(Date.now());
      dispatch(appActions.setSettingLocal({ key: "updatesCheckedAt", value: now }));
      api.setSetting("updatesCheckedAt", now);
      if (!r.configured) setState({ kind: "notConfigured" });
      else if (r.available) setState({ kind: "available", feed: r.available });
      else if (r.needsNewerApp) setState({ kind: "needsNewerApp", feed: r.needsNewerApp });
      else setState({ kind: "upToDate" });
    } catch (e) {
      setState({ kind: "failed", message: firstLine(e), detail: String(e) });
    }
  };

  const install = async (feed: UpdateFeed) => {
    setState({ kind: "downloading", feed, done: 0, total: feed.size });
    try {
      const changed = await api.installUpdate(feed);
      setState({ kind: "installing", feed });
      await dispatch(loadCatalog());
      setState({ kind: "installed", version: feed.contentVersion, openLessonChanged: changed });
    } catch (e) {
      setState({ kind: "failed", message: firstLine(e), detail: String(e) });
    }
  };

  const checked = lastChecked ? `Checked ${relative(Number(lastChecked))}` : "Never checked";

  return (
    <div className="rounded-md border border-edge p-3" aria-live="polite">
      <div className="font-medium">Lesson content</div>
      {state.kind === "idle" && (
        <>
          <div className="mt-1 text-fg-2">
            Installed {installed} · {checked}
          </div>
          <Button className="mt-2" onClick={check}>
            Check for updates
          </Button>
        </>
      )}
      {state.kind === "checking" && (
        <>
          <div className="mt-1 text-fg-2">Installed {installed}</div>
          <Button className="mt-2" loading>
            Checking…
          </Button>
        </>
      )}
      {state.kind === "notConfigured" && (
        <Banner tone="info" className="mt-2">
          This build of Canopy has no lesson update source configured. Lessons keep working offline.
        </Banner>
      )}
      {state.kind === "upToDate" && (
        <>
          <div className="mt-1 flex items-center gap-1.5 text-fg">
            <CheckCircle2 size={14} className="text-success" /> You have the latest lessons. · Checked just now
          </div>
          <Button variant="ghost" className="mt-2" onClick={check}>
            Check again
          </Button>
        </>
      )}
      {state.kind === "available" && (
        <>
          <div className="mt-1">
            {state.feed.contentVersion} available · {mb(state.feed.size)}
          </div>
          {state.feed.changelog && (
            <details className="mt-1 text-fg-2">
              <summary className="cursor-pointer">What changed</summary>
              <div className="lesson-md mt-1 max-h-60 overflow-y-auto text-sm">
                <ReactMarkdown>{state.feed.changelog}</ReactMarkdown>
              </div>
            </details>
          )}
          <div className="mt-2 flex gap-2">
            <Button variant="primary" icon={Download} onClick={() => install(state.feed)}>
              Download and install
            </Button>
            <Button variant="ghost" onClick={() => setState({ kind: "idle" })}>
              Not now
            </Button>
          </div>
        </>
      )}
      {state.kind === "downloading" && (
        <div className="mt-2">
          <ProgressBar done={state.done} total={state.total || 1} label="Download progress" />
          <div className="mt-1 text-fg-2">
            Downloading… {mb(state.done)} of {mb(state.total)}
          </div>
        </div>
      )}
      {state.kind === "installing" && <div className="mt-2 text-fg-2">Installing…</div>}
      {state.kind === "installed" && (
        <>
          <div className="mt-1 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-success" /> Installed {state.version}. Your progress is unchanged.
          </div>
          {state.openLessonChanged && <div className="mt-1 text-fg-2">The lesson you have open was updated. Reset lesson to load the new version.</div>}
          <Button className="mt-2" onClick={() => setState({ kind: "idle" })}>
            Done
          </Button>
        </>
      )}
      {state.kind === "needsNewerApp" && (
        <Banner tone="warning" className="mt-2" title="This update needs a newer Canopy.">
          Lesson pack {state.feed.contentVersion} uses lesson format {state.feed.formatVersion}. This version of Canopy reads format 1.
        </Banner>
      )}
      {state.kind === "failed" && (
        <>
          <div className="mt-1 flex items-center gap-1.5">
            <XCircle size={14} className="text-danger" /> {state.message}
          </div>
          <details className="mt-1 text-xs text-fg-2">
            <summary className="cursor-pointer">Details</summary>
            <pre className="selectable mt-1 whitespace-pre-wrap">{state.detail}</pre>
          </details>
          <div className="mt-2 flex gap-2">
            <Button onClick={check}>Try again</Button>
            <Button variant="ghost" onClick={() => setState({ kind: "idle" })}>
              Not now
            </Button>
          </div>
        </>
      )}
      <p className="mt-2 text-xs text-fg-3">
        Canopy only goes online when you press this button.
      </p>
    </div>
  );
}

function firstLine(e: unknown) {
  return String(e).replace(/^Error:\s*/, "").split("\n")[0].split(":")[0];
}

function relative(ms: number) {
  const mins = Math.round((Date.now() - ms) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
}
