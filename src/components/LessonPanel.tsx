// Left pane of the workspace: the lesson, as two tabs (Read, Try it) under a
// pinned title, with a hint button and a bottom bar (UX_REVIEW_3.md 4–5).

import { ArrowRight, Check, CheckCircle2, ChevronLeft, Circle, Eye, PanelLeftClose, Play, X } from "lucide-react";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { LessonView, PublicQuestion } from "../api";
import { api } from "../api";
import { go, lessonActions, runAction, setSetting, skipLesson, submitAnswer, useAppDispatch, useAppSelector } from "../store";
import { missingRecommended, neighbours } from "../store/progress";
import { Banner, Button, IconButton, Skeleton } from "./ui";

type Tab = "read" | "try" | "hints";

/** Remembered tab per lesson for this session (not persisted). */
export const lessonTabMemory = new Map<string, Tab>();

/** Split content.md into reading, steps and recap (UX_REVIEW_3.md 4.3). */
export function splitLesson(md: string): { read: string; steps: string | null; recap: string } {
  const recapAt = /^##\s+What just happened\s*$/im.exec(md);
  const body = recapAt ? md.slice(0, recapAt.index) : md;
  const recap = recapAt ? md.slice(recapAt.index + recapAt[0].length).trim() : "";
  const tryAt = /^##\s+Try it\s*$/im.exec(body);
  if (!tryAt) return { read: body, steps: null, recap };
  return { read: body.slice(0, tryAt.index), steps: body.slice(tryAt.index + tryAt[0].length), recap };
}

type GoalRow = { label: string; passed: boolean; sticky: boolean; question?: string };

type Ticks = { labels: GoalRow[]; done: number; total: number; complete: boolean; justTicked: string | null };

/** Lets the markdown renderer place action buttons under the step that names them. */
const ActionsContext = createContext<{ render: (label: string) => React.ReactNode; placed: Set<string> } | null>(null);

export function LessonPanel({
  onReset,
  onViewScript,
  onCollapse,
}: {
  onReset: () => void;
  onViewScript: (path: string, source: string) => void;
  onCollapse: () => void;
}) {
  const dispatch = useAppDispatch();
  const cat = useAppSelector((s) => s.catalog.data)!;
  const lesson = useAppSelector((s) => s.lesson);
  const view = lesson.view;
  const ticks = useGoalTicksSafe(view);
  const [tab, setTabState] = useState<Tab>("read");
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollMemory = useRef<Record<Tab, number>>({ read: 0, try: 0, hints: 0 });

  // Pick the tab when a lesson opens: Read the first time, Try it when resuming or done.
  const lessonKey = view ? `${view.meta.id}:${lesson.generation}` : "";
  const resumed = Boolean(lesson.update && (lesson.update.commands > 0 || lesson.update.complete)) || Boolean(view && Object.keys(view.answers).length > 0);
  useEffect(() => {
    if (!view) return;
    const remembered = lessonTabMemory.get(view.meta.id);
    const boss = splitLesson(view.content).steps === null;
    setTabState(remembered ?? (resumed || boss ? "try" : "read"));
    scrollMemory.current = { read: 0, try: 0, hints: 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonKey]);
  // A lesson that turns out to be resumed (update arrives after load) opens on Try it.
  useEffect(() => {
    if (view && resumed && !lessonTabMemory.has(view.meta.id)) setTabState("try");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumed]);

  // Alt+H (handled in the store) asks for the Hints tab.
  useEffect(() => {
    if (lesson.hintRequest > 0 && view) {
      setTabState("hints");
      lessonTabMemory.set(view.meta.id, "hints");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.hintRequest]);

  if (!view || !ticks)
    return (
      <div className="p-5">
        <Skeleton label="Loading lesson" lines={["70%", 40]} className="mb-8 [&>div]:h-5" />
        <Skeleton label="" lines={[100, 96, 88, 100, 62]} />
      </div>
    );
  const meta = view.meta;
  const missing = missingRecommended(cat, meta.id);
  const sectionDoneOtherwise = cat.lessons.filter((l) => l.section === meta.section && l.id !== meta.id).every((l) => cat.completed[l.id]);
  const showNotice = missing.length > 0 && !(meta.kind === "boss" && sectionDoneOtherwise);
  const parts = splitLesson(view.content);
  const tabbed = parts.steps !== null;
  // Boss lessons have no Read/Try it split: one Challenge tab holds both.
  const tabs: { id: Tab; label: string }[] = [
    ...(tabbed
      ? [
          { id: "read" as Tab, label: "Read" },
          { id: "try" as Tab, label: "Try it" },
        ]
      : [{ id: "try" as Tab, label: "Challenge" }]),
    ...(meta.hints.length > 0 ? [{ id: "hints" as Tab, label: "Hints" }] : []),
  ];
  const current: Tab = tabs.some((t) => t.id === tab) ? tab : tabs[0].id;

  const setTab = (t: Tab) => {
    if (panelRef.current) scrollMemory.current[tab] = panelRef.current.scrollTop;
    setTabState(t);
    lessonTabMemory.set(meta.id, t);
    requestAnimationFrame(() => {
      if (panelRef.current) panelRef.current.scrollTop = scrollMemory.current[t];
    });
  };
  const showRecap = () => {
    setTab("try");
    setTimeout(() => document.getElementById("lesson-recap")?.scrollIntoView({ block: "start", behavior: "smooth" }), 50);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Focus goes to the terminal; screen readers hear the lesson title. */}
      <div className="sr-only" aria-live="polite">
        Lesson {meta.id}: {meta.title}
      </div>
      <header className="lesson-scale shrink-0 px-5 pt-4 pb-3 2xl:px-6">
        <h1 id="lesson-title" className="text-[1.4667em] leading-[1.27] font-semibold">
          {meta.title}
        </h1>
        {showNotice && (
          <p className="mt-[0.3em] text-[0.8em] text-fg-3">
            Easier after{" "}
            {missing.slice(0, 1).map((l) => (
              <button key={l.id} className="text-fg-2 hover:text-fg hover:underline" onClick={() => dispatch(go({ kind: "lesson", lesson: l.id }))}>
                {l.id} {l.title}
              </button>
            ))}
            {missing.length > 1 && (
              <>
                {" and "}
                <button className="text-fg-2 hover:text-fg hover:underline" onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "l", altKey: true }))}>
                  {missing.length - 1} more
                </button>
              </>
            )}
          </p>
        )}
      </header>

      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-edge pr-2 pl-5 2xl:pl-6">
        <LessonTabs tab={tab} onTab={setTab} tabs={tabs} />
        <div className="ml-auto flex items-center gap-1">
          <IconButton icon={PanelLeftClose} label="Hide lesson panel (Alt+[)" onClick={onCollapse} />
        </div>
      </div>

      <div
        ref={panelRef}
        role="tabpanel"
        id={`lesson-panel-${current}`}
        aria-labelledby={`lesson-tab-${current}`}
        tabIndex={0}
        className="lesson-scale min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-8 outline-none 2xl:px-6"
      >
        {(current === "read" || (!tabbed && current === "try")) && (
          <>
            <div className="flex flex-col gap-3 empty:hidden">
              <Preflight />
              {meta.flags.includes("destructive") && (
                <Banner tone="warning" title="Destructive commands ahead.">
                  This lesson throws away work on purpose. Only the learning folder changes, and Reset lesson brings it back.
                </Banner>
              )}
            </div>
            <Markdown text={parts.read} />
            {tabbed && (
              <Button scaled className="mt-[1.6em]" onClick={() => setTab("try")}>
                Try it <ArrowRight size="1em" />
              </Button>
            )}
          </>
        )}
        {current === "try" && (
          <TryIt view={view} steps={parts.steps} recap={parts.recap} ticks={ticks} tabbed={tabbed} onReset={onReset} onViewScript={onViewScript} />
        )}
        {current === "hints" && <Hints hints={meta.hints} onReset={onReset} />}
      </div>
      <BottomBar ticks={ticks} onComplete={showRecap} />
    </div>
  );
}

/** Goal state plus the goal that just ticked; the one place that detects ticks. */
function useGoalTicksSafe(view: LessonView | null): Ticks | null {
  // Hooks must run unconditionally; return null until the lesson is loaded.
  const t = useGoalTicks(view);
  return view ? t : null;
}

function useGoalTicks(view: LessonView | null): Ticks {
  const lesson = useAppSelector((s) => s.lesson);
  const labels: GoalRow[] = lesson.update?.goals ?? (view?.goals ?? []).map((label) => ({ label, passed: false, sticky: false }));
  const done = labels.filter((g) => g.passed).length;
  const complete = Boolean(lesson.update?.complete);
  const [justTicked, setJustTicked] = useState<string | null>(null);
  const prev = useRef<boolean[] | null>(null);
  useEffect(() => {
    const now = labels.map((g) => g.passed);
    const ticked = prev.current && prev.current.length === now.length ? labels.find((g, i) => g.passed && prev.current![i] === false) : undefined;
    prev.current = now;
    if (ticked) {
      setJustTicked(ticked.label);
      const t = setTimeout(() => setJustTicked(null), 3000);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.update]);
  return { labels, done, total: labels.length, complete, justTicked };
}

/** Read | Try it | Hints, as ARIA tabs with arrow keys and a roving tabindex. */
function LessonTabs({ tab, onTab, tabs }: { tab: Tab; onTab: (t: Tab) => void; tabs: { id: Tab; label: string }[] }) {
  const refs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const move = (to: Tab) => {
    onTab(to);
    refs.current[to]?.focus();
  };
  const ids = tabs.map((t) => t.id);
  const current = ids.includes(tab) ? tab : ids[0];
  return (
    <div role="tablist" aria-label="Lesson" className="flex h-full items-end gap-6">
      {tabs.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => {
            refs.current[t.id] = el;
          }}
          role="tab"
          id={`lesson-tab-${t.id}`}
          aria-controls={`lesson-panel-${t.id}`}
          aria-selected={current === t.id}
          tabIndex={current === t.id ? 0 : -1}
          onClick={() => onTab(t.id)}
          onKeyDown={(e) => {
            const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: ids.length - 1 }[e.key];
            if (to === undefined) return;
            e.preventDefault();
            move(ids[(to + ids.length) % ids.length]);
          }}
          className={`-mb-px h-9 border-b-2 text-sm font-medium transition-colors ${current === t.id ? "border-fg text-fg" : "border-transparent text-fg-2 hover:text-fg"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function TryIt({
  view,
  steps,
  recap,
  ticks,
  tabbed,
  onReset,
  onViewScript,
}: {
  view: LessonView;
  steps: string | null;
  recap: string;
  ticks: Ticks;
  tabbed: boolean;
  onReset: () => void;
  onViewScript: (path: string, source: string) => void;
}) {
  const dispatch = useAppDispatch();
  const cat = useAppSelector((s) => s.catalog.data)!;
  const lesson = useAppSelector((s) => s.lesson);
  const meta = view.meta;
  const placed = useMemo(() => new Set<string>(), [view, steps]);
  const actionBlock = (label: string) => {
    const a = view.actions.find((x) => x.label === label);
    if (!a) return null;
    return (
      <span className="mt-[0.5em] flex flex-wrap items-center gap-x-[0.8em] gap-y-1">
        <Button scaled icon={Play} loading={lesson.runningAction === a.id} disabled={lesson.status !== "running"} onClick={() => dispatch(runAction({ id: a.id, label: a.label }))}>
          {a.label}
        </Button>
        <button className="text-[0.8em] text-fg-3 hover:text-fg hover:underline" onClick={() => onViewScript(a.script, a.source)}>
          What does this do?
        </button>
      </span>
    );
  };
  // Actions no step mentions still need a home: after the steps.
  const text = steps ?? "";
  const unplaced = view.actions.filter((a) => !text.includes(`**${a.label}**`));

  return (
    <ActionsContext.Provider value={{ render: actionBlock, placed }}>
      {tabbed && meta.flags.includes("destructive") && <p className="text-[0.8em] text-warning">Destructive: Reset lesson brings everything back.</p>}
      {steps !== null && <Markdown text={steps} />}
      {unplaced.map((a) => (
        <div key={a.id}>{actionBlock(a.label)}</div>
      ))}
      {view.questions.map((q, i) => (
        <QuestionCard key={q.id} q={q} n={i + 1} total={view.questions.length} />
      ))}
      <GoalsList ticks={ticks} />
      {ticks.complete && recap && (
        <section id="lesson-recap" className="recap-in mt-[1.2em] scroll-mt-4 border-l-2 border-success pl-[0.8em]" aria-label="What just happened">
          <h2 className="font-semibold">What just happened</h2>
          <Markdown text={recap} tight />
        </section>
      )}
      <p className="mt-[2em] text-[0.8em] text-fg-3">
        Stuck, or want a clean start?{" "}
        <button className="font-medium text-fg-2 underline-offset-2 hover:text-fg hover:underline" onClick={onReset}>
          Reset lesson
        </button>
        {meta.flags.includes("optional") && !ticks.complete && !cat.skipped.includes(meta.id) && (
          <>
            {" · This lesson is optional: "}
            <button className="font-medium text-fg-2 hover:text-fg hover:underline" onClick={() => dispatch(skipLesson(meta.id))}>
              Skip lesson
            </button>
          </>
        )}
      </p>
    </ActionsContext.Provider>
  );
}

/** Text of a React subtree (for matching an action label inside a list item). */
function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement(node)) return textOf((node.props as { children?: React.ReactNode }).children);
  return "";
}

/** List item that also renders the action button its text names in bold. */
function StepItem({ children, ...rest }: React.LiHTMLAttributes<HTMLLIElement> & { node?: unknown }) {
  const ctx = useContext(ActionsContext);
  delete (rest as { node?: unknown }).node;
  let extra: React.ReactNode = null;
  if (ctx) {
    // Bold text in this item that matches an action label.
    const bolds: string[] = [];
    const walk = (n: React.ReactNode) => {
      if (Array.isArray(n)) n.forEach(walk);
      else if (React.isValidElement(n)) {
        if (n.type === "strong") bolds.push(textOf(n));
        else walk((n.props as { children?: React.ReactNode }).children);
      }
    };
    walk(children);
    extra = bolds.map((b) => <React.Fragment key={b}>{ctx.render(b)}</React.Fragment>);
  }
  return (
    <li {...rest}>
      {children}
      {extra}
    </li>
  );
}

function Markdown({ text, tight }: { text: string; tight?: boolean }) {
  return (
    <div className={`lesson-md max-w-[60ch] text-fg selectable ${tight ? "mt-[0.4em]" : "mt-[0.6em] first:mt-0"}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ li: StepItem }}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

/** Goals, right after the steps and questions: what is checked. */
function GoalsList({ ticks }: { ticks: Ticks }) {
  const dispatch = useAppDispatch();
  const tickNoteSeen = useAppSelector((s) => s.app.settings.goalNoteSeen === "1");
  const [note, setNote] = useState(false);
  const { labels, done, complete } = ticks;

  // The first goal that ever ticks explains, once, that goals tick on their own.
  useEffect(() => {
    if (ticks.justTicked && !tickNoteSeen) {
      setNote(true);
      dispatch(setSetting({ key: "goalNoteSeen", value: "1" }));
      const t = setTimeout(() => setNote(false), 4000);
      return () => clearTimeout(t);
    }
  }, [ticks.justTicked, tickNoteSeen, dispatch]);

  const showQuestion = (id: string) => {
    const el = document.getElementById(`question-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    el?.querySelector<HTMLElement>("input, button")?.focus({ preventScroll: true });
  };

  // Several "answer" goals read as one row: "Answer the questions · 1 of 3".
  const answers = labels.filter((g) => g.question);
  const rows: (GoalRow & { group?: GoalRow[] })[] = [];
  let grouped = false;
  for (const g of labels) {
    if (g.question && answers.length >= 2) {
      if (!grouped) {
        grouped = true;
        const okCount = answers.filter((a) => a.passed).length;
        rows.push({ label: `Answer the questions · ${okCount} of ${answers.length}`, passed: okCount === answers.length, sticky: false, question: answers.find((a) => !a.passed)?.question, group: answers });
      }
    } else rows.push(g);
  }

  return (
    <section className="mt-[1.6em]" aria-label="Goals">
      <div className="flex items-baseline justify-between">
        <h2 className={`font-semibold ${complete ? "text-success" : ""}`}>{complete ? "Goals · complete" : "Goals"}</h2>
        <span className="text-[0.8em] text-fg-3 tabular-nums">
          {done} of {labels.length}
        </span>
      </div>
      <ul className="mt-[0.4em] text-[0.9333em] leading-[1.43]">
        {rows.map((g, i) => {
          const body = (
            <>
              {g.passed ? (
                <CheckCircle2 size="1.2em" className="goal-pass mt-[0.1em] shrink-0 fill-success text-surface" aria-label="Done" />
              ) : (
                <Circle size="1.2em" strokeWidth={1.5} className="mt-[0.1em] shrink-0 text-edge-2" aria-label="Not done yet" />
              )}
              <span className="min-w-0 flex-1 text-left">{g.label}</span>
            </>
          );
          return (
            <li key={i}>
              {g.question && !g.passed ? (
                <button className="-mx-1 flex min-h-[2em] w-[calc(100%+0.5rem)] items-start gap-[0.5em] rounded-sm px-1 py-[0.25em] hover:bg-sunken" onClick={() => showQuestion(g.question!)} title="Show the question">
                  {body}
                </button>
              ) : (
                <div className="flex min-h-[2em] items-start gap-[0.5em] py-[0.25em]">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      {note && <p className="mt-[0.3em] text-[0.8em] text-fg-3">Goals tick on their own as you work.</p>}
    </section>
  );
}

/** Hints tab: each hint stays blurred until the learner asks for it. */
function Hints({ hints, onReset }: { hints: string[]; onReset: () => void }) {
  const dispatch = useAppDispatch();
  const shown = useAppSelector((s) => s.lesson.hintsShown);
  return (
    <section aria-label="Hints">
      <p className="text-[0.8667em] text-fg-3">Try on your own first. Each hint gives away a little more.</p>
      <ol className="mt-[1em] flex flex-col gap-[0.8em]">
        {hints.map((h, i) => {
          const open = i < shown;
          return (
            <li key={i} className="rounded-md border border-edge bg-surface px-[0.9em] py-[0.7em]">
              <div className="text-[0.8em] font-medium text-fg-3">Hint {i + 1}</div>
              {open ? (
                <div aria-live="polite" className="lesson-md mt-[0.3em] text-[0.9333em] leading-[1.55] selectable">
                  <ReactMarkdown>{h}</ReactMarkdown>
                </div>
              ) : (
                <div className="relative mt-[0.3em]">
                  {/* The real text, blurred, so the length shows but not the words. */}
                  <div aria-hidden className="lesson-md pointer-events-none text-[0.9333em] leading-[1.55] blur-[5px] select-none">
                    <ReactMarkdown>{h}</ReactMarkdown>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button scaled size="sm" icon={Eye} onClick={() => dispatch(lessonActions.showHint(i + 1))}>
                      {i > shown ? `Show hints ${shown + 1}–${i + 1}` : "Show hint"}
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {shown >= hints.length && (
        <p className="mt-[1em] text-[0.8em] text-fg-3">
          Still stuck?{" "}
          <button className="font-medium text-fg-2 hover:text-fg hover:underline" onClick={onReset}>
            Reset lesson
          </button>{" "}
          and start over.
        </p>
      )}
    </section>
  );
}

/** Pinned one-line bar: Previous · status · Next (UX_REVIEW_3.md 4.6). */
function BottomBar({ ticks, onComplete }: { ticks: Ticks; onComplete: () => void }) {
  const dispatch = useAppDispatch();
  const cat = useAppSelector((s) => s.catalog.data)!;
  const lesson = useAppSelector((s) => s.lesson);
  const view = lesson.view!;
  const { done, total, complete, justTicked } = ticks;
  const nb = neighbours(cat, view.meta.id);
  const [announce, setAnnounce] = useState("");
  useEffect(() => {
    if (justTicked) setAnnounce(`Goal complete: ${justTicked} (${done} of ${total}).`);
  }, [justTicked, done, total]);
  useEffect(() => {
    if (lesson.update?.justCompleted) setAnnounce(`Lesson complete.${nb.next ? ` Next: ${nb.next.title}.` : ""}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.update?.justCompleted]);
  const nextSection = nb.next && nb.next.section !== view.meta.section ? cat.sections.find((s) => s.id === nb.next!.section) : null;
  const nextLabel = nextSection ? `Next section: ${nextSection.title}` : `Next: ${nb.next?.title ?? ""}`;

  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-t border-edge bg-surface px-2">
      <div className="sr-only" aria-live="polite">
        {announce}
      </div>
      <IconButton icon={ChevronLeft} label={nb.prev ? `Previous: ${nb.prev.title} (Alt+←)` : "No previous lesson"} size={28} disabled={!nb.prev} onClick={() => nb.prev && dispatch(go({ kind: "lesson", lesson: nb.prev.id }))} />
      <div className={`min-w-0 text-sm ${complete ? "shrink-0" : "flex-1 truncate"}`}>
        {complete ? (
          <button className="flex items-center gap-1.5 rounded-sm px-1 font-medium whitespace-nowrap text-success hover:underline" onClick={onComplete} title="What just happened">
            <CheckCircle2 size={15} /> Complete
          </button>
        ) : justTicked ? (
          <span className="flex items-center gap-1.5 text-success" aria-hidden>
            <CheckCircle2 size={15} className="shrink-0" /> <span className="truncate">{justTicked}</span>
          </span>
        ) : (
          <span className="text-fg-2" aria-hidden>
            {done} of {total} goals
          </span>
        )}
      </div>
      {nb.next && (
        <Button
          variant={complete ? "primary" : "ghost"}
          onClick={() => dispatch(go({ kind: "lesson", lesson: nb.next!.id }))}
          title={`${nextLabel} (Alt+→)`}
          className={`ml-auto min-w-0 ${complete ? "max-w-[70%] flex-1" : ""}`}
        >
          <span className="truncate">{complete ? nextLabel : "Next"}</span>
          <ArrowRight size={14} className="shrink-0" />
        </Button>
      )}
    </div>
  );
}

function QuestionCard({ q, n, total }: { q: PublicQuestion; n: number; total: number }) {
  const dispatch = useAppDispatch();
  const feedback = useAppSelector((s) => s.lesson.feedback[q.id]);
  const saved = useAppSelector((s) => s.lesson.view?.answers[q.id]);
  const running = useAppSelector((s) => s.lesson.status === "running");
  const [value, setValue] = useState<string | number | number[] | null>(() => (saved ? (saved.value as never) : q.type === "choice" && q.multiple ? [] : null));
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const correct = feedback === "correct";

  // Clicking a node in the graph while this box has focus inserts its id.
  useEffect(() => {
    const el = inputRef.current;
    if (!el || q.type !== "commit") return;
    const onInsert = (e: Event) => {
      dispatch(lessonActions.answerReopened(q.id));
      setValue((e as CustomEvent<string>).detail);
    };
    el.addEventListener("canopy-insert-commit", onInsert);
    return () => el.removeEventListener("canopy-insert-commit", onInsert);
  }, [q.id, q.type, dispatch]);
  const hasValue = Array.isArray(value) ? value.length > 0 : value !== null && value !== "";

  const check = async () => {
    if (!hasValue || busy) return;
    setBusy(true);
    try {
      await dispatch(submitAnswer({ question: q.id, value })).unwrap();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id={`question-${q.id}`} className={`mt-[1.2em] scroll-mt-4 rounded-md border p-[0.8em] ${correct ? "border-success" : "border-edge"}`} aria-label="Question">
      {total > 1 && <div className="mb-[0.3em] text-[0.8em] text-fg-3">Question {n} of {total}</div>}
      <div className="font-medium">{q.prompt}</div>
      <div className="mt-[0.5em] text-[0.9333em]">
        {q.type === "choice" ? (
          <div role={q.multiple ? "group" : "radiogroup"} className="flex flex-col">
            {q.options.map((opt, i) => {
              const selected = Array.isArray(value) ? value.includes(i) : value === i;
              const wrongPick = feedback === "wrong" && selected;
              return (
                <label key={i} className={`flex min-h-[2.2em] cursor-pointer items-center gap-[0.5em] rounded-sm px-1 ${wrongPick ? "bg-sunken" : "hover:bg-sunken"}`}>
                  <input
                    type={q.multiple ? "checkbox" : "radio"}
                    name={q.id}
                    disabled={correct}
                    checked={selected}
                    className="h-[1em] w-[1em] accent-[var(--color-accent)]"
                    onChange={() => {
                      if (feedback === "wrong") dispatch(lessonActions.answerReopened(q.id));
                      if (q.multiple) {
                        const arr = Array.isArray(value) ? value : [];
                        setValue(arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i]);
                      } else setValue(i);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && check()}
                  />
                  <span className="selectable">{opt}</span>
                  {wrongPick && <X size={14} className="ml-auto text-fg-3" aria-label="Not this one" />}
                </label>
              );
            })}
          </div>
        ) : (
          <input
            ref={inputRef}
            data-commit-question={q.type === "commit" ? q.id : undefined}
            type="text"
            inputMode={q.type === "number" ? "numeric" : undefined}
            readOnly={correct}
            value={(value as string | number | null) ?? ""}
            placeholder={q.type === "commit" ? "hash or ref" : q.type === "number" ? "number" : "answer"}
            onChange={(e) => {
              if (feedback === "wrong") dispatch(lessonActions.answerReopened(q.id));
              setValue(e.target.value);
            }}
            onKeyDown={(e) => (e.key === "Enter" || (e.key === "Enter" && e.ctrlKey)) && check()}
            className={`h-[2.2em] rounded-sm border border-edge-2 bg-surface px-[0.5em] text-fg focus:border-accent focus:outline-none ${
              q.type === "commit" ? "w-[11em] font-mono" : q.type === "number" ? "w-[6em] tabular-nums" : "w-full"
            }`}
            aria-label={q.prompt}
          />
        )}
        {q.type === "commit" && !correct && <div className="mt-[0.3em] text-[0.8em] text-fg-3">At least 4 characters of the id. Or click a commit in the graph.</div>}
      </div>
      <div className="mt-[0.6em] flex flex-wrap items-center gap-[0.8em]" aria-live="polite">
        {correct ? (
          <>
            <span className="flex items-center gap-1 font-medium text-success">
              <Check size="1em" /> Correct.
            </span>
            <button className="text-[0.8em] text-fg-3 hover:text-fg hover:underline" onClick={() => dispatch(lessonActions.answerReopened(q.id))}>
              Change answer
            </button>
          </>
        ) : (
          <>
            <Button scaled loading={busy} disabled={!hasValue || !running} onClick={check}>
              Check answer
            </Button>
            {feedback === "wrong" && <span className="text-[0.9333em] text-fg-2">Not quite. Try again.</span>}
          </>
        )}
      </div>
    </section>
  );
}

/** Tool missing / git too old card with a Skip option (DESIGN.md 4.8). */
function Preflight() {
  const dispatch = useAppDispatch();
  const cat = useAppSelector((s) => s.catalog.data)!;
  const lesson = useAppSelector((s) => s.lesson);
  const git = useAppSelector((s) => s.app.git);
  const meta = lesson.view!.meta;
  const summary = cat.lessons.find((l) => l.id === meta.id);
  const skipped = cat.skipped.includes(meta.id);
  const [checking, setChecking] = useState(false);
  const missing = lesson.missingTools;
  const oldGit = summary?.needsNewerGit;
  if (!missing.length && !oldGit) return null;
  const skip = (
    <Button disabled={skipped} onClick={() => dispatch(skipLesson(meta.id))}>
      {skipped ? "Skipped" : "Skip this lesson"}
    </Button>
  );
  if (oldGit) {
    return (
      <Banner tone="warning" title={`This lesson needs git ${meta.minGit} or newer.`} actions={skip}>
        You have {git?.version}. Update git to do this lesson, or skip it for now. Skipping counts it as done.
      </Banner>
    );
  }
  const recheck = async () => {
    setChecking(true);
    const found = await api.toolCheck(meta.tools);
    dispatch(lessonActions.setMissingTools(meta.tools.filter((t) => !found[t])));
    setChecking(false);
  };
  return (
    <Banner
      tone="warning"
      title={`This lesson needs ${missing.join(" and ")}.`}
      actions={
        <>
          <Button loading={checking} onClick={recheck}>
            Check again
          </Button>
          {skip}
        </>
      }
    >
      Canopy could not find {missing.join(" or ")} on this computer. Install it and press Check again, or skip this lesson. Skipping counts it as done.
    </Banner>
  );
}

