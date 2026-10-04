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

  const checked = lastChecked ? `checked ${relative(Number(lastChecked))}` : "never checked";

  // Row layout like the other settings: status left, one button right,
  // anything longer (changelog, progress, errors) below.
  let status: React.ReactNode = `Lesson pack ${installed} · ${checked}`;
  let control: React.ReactNode = <Button onClick={check}>Check for updates</Button>;
  let extra: React.ReactNode = null;
  switch (state.kind) {
    case "checking":
      control = <Button loading>Checking…</Button>;
      break;
    case "notConfigured":
      status = "No update source in this build. Lessons keep working offline.";
      control = null;
      break;
    case "upToDate":
      status = (
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 size={12} className="text-success" /> Up to date · lesson pack {installed}
        </span>
      );
      control = (
        <Button variant="ghost" onClick={check}>
          Check again
        </Button>
      );
      break;
    case "available":
      status = `${state.feed.contentVersion} available · ${mb(state.feed.size)}`;
      control = (
        <Button variant="primary" icon={Download} onClick={() => install(state.feed)}>
          Install
        </Button>
      );
      extra = state.feed.changelog && (
        <details className="text-xs text-fg-2">
          <summary className="cursor-pointer">What changed</summary>
          <div className="lesson-md mt-1 max-h-60 overflow-y-auto text-sm">
            <ReactMarkdown>{state.feed.changelog}</ReactMarkdown>
          </div>
        </details>
      );
      break;
    case "downloading":
      status = `Downloading… ${mb(state.done)} of ${mb(state.total)}`;
      control = null;
      extra = <ProgressBar done={state.done} total={state.total || 1} label="Download progress" />;
      break;
    case "installing":
      status = "Installing…";
      control = null;
      break;
    case "installed":
      status = (
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 size={12} className="text-success" /> Installed {state.version}. Your progress is unchanged.
        </span>
      );
      control = <Button onClick={() => setState({ kind: "idle" })}>Done</Button>;
      if (state.openLessonChanged) extra = <p className="text-xs text-fg-2">The lesson you have open was updated. Reset lesson to load the new version.</p>;
      break;
    case "needsNewerApp":
      status = `${state.feed.contentVersion} needs a newer Canopy`;
      extra = (
        <Banner tone="warning">
          Lesson pack {state.feed.contentVersion} uses lesson format {state.feed.formatVersion}. This version of Canopy reads format 1.
        </Banner>
      );
      break;
    case "failed":
      status = (
        <span className="inline-flex items-center gap-1">
          <XCircle size={12} className="text-danger" /> {state.message}
        </span>
      );
      control = <Button onClick={check}>Try again</Button>;
      extra = (
        <details className="text-xs text-fg-2">
          <summary className="cursor-pointer">Details</summary>
          <pre className="selectable mt-1 whitespace-pre-wrap">{state.detail}</pre>
        </details>
      );
      break;
  }

  return (
    <div className="px-3.5 py-2.5" aria-live="polite">
      <div className="flex min-h-7 items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-[0.84375rem] leading-5 font-medium">Lesson content</div>
          <div className="mt-0.5 text-xs leading-4 text-fg-3">{status}</div>
        </div>
        {control}
      </div>
      {extra && <div className="mt-2">{extra}</div>}
      <p className="mt-1.5 text-xs text-fg-3">Canopy only goes online when you press the button.</p>
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
