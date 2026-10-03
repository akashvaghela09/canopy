// Left pane of the workspace: lesson text, notices, events, questions, hints
// and the pinned goals footer (DESIGN.md 4.2).

import { ArrowRight, Check, CheckCircle2, Circle, Lightbulb, PanelLeftClose, Play, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { PublicQuestion } from "../api";
import { api } from "../api";
import { appActions, lessonActions, runAction, skipLesson, submitAnswer, useAppDispatch, useAppSelector } from "../store";
import { missingRecommended, neighbours } from "../store/progress";
import { Banner, Button, Chip, IconButton } from "./ui";

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

  if (!view) return <div className="p-4 text-sm text-fg-3">Loading lesson…</div>;
  const meta = view.meta;
  const missing = missingRecommended(cat, meta.id);
  const sectionDoneOtherwise = cat.lessons.filter((l) => l.section === meta.section && l.id !== meta.id).every((l) => cat.completed[l.id]);
  const showNotice = missing.length > 0 && !lesson.noticeDismissed && !(meta.kind === "boss" && sectionDoneOtherwise);
  const { tryIt, after } = splitContent(view.content);
  const complete = Boolean(lesson.update?.complete);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Focus goes to the terminal; screen readers hear the lesson title. */}
      <div className="sr-only" aria-live="polite">
        Lesson {meta.id}: {meta.title}
      </div>
      <article className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-6" aria-labelledby="lesson-title">
        <div className="flex items-start gap-2">
          <h1 id="lesson-title" className="min-w-0 flex-1 pt-1 text-xl font-semibold">
            {meta.title}
          </h1>
          <IconButton icon={PanelLeftClose} label="Hide lesson panel (Alt+[)" onClick={onCollapse} className="mt-1" />
        </div>

        <div className="mt-3 flex flex-col gap-3">
          <Preflight />
          {meta.flags.includes("destructive") && (
            <Banner tone="warning" title="Destructive commands ahead.">
              This lesson throws away work on purpose. Only the learning folder changes, and Reset lesson brings it back.
            </Banner>
          )}
          {showNotice && (
            <p className="flex items-start gap-1 text-sm text-fg-2">
              <span className="min-w-0 flex-1">
                Easier after:{" "}
                {missing.slice(0, 2).map((l, i) => (
                  <span key={l.id}>
                    {i > 0 && ", "}
                    <button className="text-accent hover:underline" onClick={() => dispatch(appActions.navigate({ kind: "lesson", lesson: l.id }))}>
                      {l.id} {l.title}
                    </button>
                  </span>
                ))}
                {missing.length > 2 && ` and ${missing.length - 2} more`}
              </span>
              <IconButton icon={X} label="Dismiss" onClick={() => dispatch(lessonActions.dismissNotice())} />
            </p>
          )}
        </div>

        <Markdown text={tryIt} />

        {view.actions.map((a) => (
          <div key={a.id} className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Button icon={Play} loading={lesson.runningAction === a.id} disabled={lesson.status !== "running"} onClick={() => dispatch(runAction({ id: a.id, label: a.label }))}>
              {a.label}
            </Button>
            {lesson.actionRuns[a.id] ? <span className="text-xs text-fg-3">Ran {lesson.actionRuns[a.id]}×</span> : null}
            <button className="text-xs text-fg-3 hover:text-fg hover:underline" onClick={() => onViewScript(a.script, a.source)}>
              What does this do?
            </button>
          </div>
        ))}

        {view.questions.map((q) => (
          <QuestionCard key={q.id} q={q} />
        ))}

        {meta.hints.length > 0 && <Hints hints={meta.hints} />}

        {after &&
          (complete ? (
            <Markdown text={after} />
          ) : (
            <details className="mt-5 text-sm text-fg-2">
              <summary className="cursor-pointer select-none">After you finish: what just happened</summary>
              <Markdown text={after.replace(/^##\s+What just happened\s*/i, "")} />
            </details>
          ))}
      </article>
      <GoalsFooter onReset={onReset} />
    </div>
  );
}

/** Split content.md so events, questions and hints sit after "Try it" and before "What just happened". */
function splitContent(md: string): { tryIt: string; after: string } {
  const m = /^##\s+What just happened/im.exec(md);
  if (!m) return { tryIt: md, after: "" };
  return { tryIt: md.slice(0, m.index), after: md.slice(m.index) };
}

function Markdown({ text }: { text: string }) {
  return (
    <div className="lesson-md mt-4 max-w-[440px] text-base text-fg selectable">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}

function QuestionCard({ q }: { q: PublicQuestion }) {
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
    <section id={`question-${q.id}`} className={`mt-4 scroll-mt-4 rounded-md border p-3 ${correct ? "border-success" : "border-edge"}`} aria-label="Question">
      <div className="text-base font-medium">{q.prompt}</div>
      <div className="mt-2">
        {q.type === "choice" ? (
          <div role={q.multiple ? "group" : "radiogroup"} className="flex flex-col">
            {q.options.map((opt, i) => {
              const selected = Array.isArray(value) ? value.includes(i) : value === i;
              const wrongPick = feedback === "wrong" && selected;
              return (
                <label key={i} className={`flex min-h-8 cursor-pointer items-center gap-2 rounded-sm px-1 text-sm ${wrongPick ? "bg-sunken" : "hover:bg-sunken"}`}>
                  <input
                    type={q.multiple ? "checkbox" : "radio"}
                    name={q.id}
                    disabled={correct}
                    checked={selected}
                    className="accent-[var(--color-accent)]"
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
            className={`h-7 rounded-sm border border-edge-2 bg-surface px-2 text-sm text-fg focus:border-accent focus:outline-none ${
              q.type === "commit" ? "w-40 font-mono" : q.type === "number" ? "w-24 tabular-nums" : "w-full"
            }`}
            aria-label={q.prompt}
          />
        )}
        {q.type === "commit" && !correct && <div className="mt-1 text-xs text-fg-3">At least 4 characters of the id, or a name like HEAD~2.</div>}
      </div>
      <div className="mt-2 flex items-center gap-3" aria-live="polite">
        {correct ? (
          <>
            <span className="flex items-center gap-1 text-sm font-medium text-success">
              <Check size={14} /> Correct.
            </span>
            <Button variant="link" className="text-xs" onClick={() => dispatch(lessonActions.answerReopened(q.id))}>
              Change answer
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" loading={busy} disabled={!hasValue || !running} onClick={check}>
              Check answer
            </Button>
            {feedback === "wrong" && <span className="text-sm text-fg-2">Not quite. Try again.</span>}
          </>
        )}
      </div>
    </section>
  );
}

function Hints({ hints }: { hints: string[] }) {
  const dispatch = useAppDispatch();
  const shown = useAppSelector((s) => s.lesson.hintsShown);
  return (
    <section className="mt-5" aria-label="Hints">
      <div className="text-sm font-medium">Hints</div>
      {hints.slice(0, shown).map((h, i) => (
        <div key={i} className="lesson-md mt-2 rounded-md bg-sunken p-3 text-sm selectable">
          <ReactMarkdown>{h}</ReactMarkdown>
        </div>
      ))}
      {shown < hints.length ? (
        <Button size="sm" icon={Lightbulb} className="mt-2" onClick={() => dispatch(lessonActions.showHint())} title="Show next hint (Alt+H)">
          Show hint {shown + 1} of {hints.length}
        </Button>
      ) : (
        <div className="mt-2 text-xs text-fg-3">That is the last hint.</div>
      )}
    </section>
  );
}

function GoalsFooter({ onReset }: { onReset: () => void }) {
  const dispatch = useAppDispatch();
  const cat = useAppSelector((s) => s.catalog.data)!;
  const lesson = useAppSelector((s) => s.lesson);
  const view = lesson.view!;
  const update = lesson.update;
  const labels = update?.goals ?? view.goals.map((label) => ({ label, passed: false, sticky: false, question: undefined as string | undefined }));
  const done = labels.filter((g) => g.passed).length;
  const complete = Boolean(update?.complete);
  const nb = neighbours(cat, view.meta.id);
  const nextIsNewSection = nb.next !== null && nb.next.section !== view.meta.section;
  const [announce, setAnnounce] = useState("");
  const prev = useRef<boolean[]>([]);

  useEffect(() => {
    const now = labels.map((g) => g.passed);
    labels.forEach((g, i) => {
      if (g.passed && prev.current[i] === false) setAnnounce(`Goal complete: ${g.label} (${done} of ${labels.length}).`);
    });
    prev.current = now;
    if (update?.justCompleted) setAnnounce(`Lesson complete.${nb.next ? ` Next: ${nb.next.title}.` : ""}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [update]);

  const goNext = () => nb.next && dispatch(appActions.navigate({ kind: "lesson", lesson: nb.next.id }));
  const showQuestion = (id: string) => {
    const el = document.getElementById(`question-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    el?.querySelector<HTMLElement>("input, button")?.focus({ preventScroll: true });
  };

  return (
    <div className="flex max-h-[35%] shrink-0 flex-col border-t border-edge bg-surface">
      <div className="sr-only" aria-live="polite">
        {announce}
      </div>
      {complete ? (
        <div className="mx-3 mt-3 flex shrink-0 items-center justify-between rounded-md border border-success/50 bg-success-soft px-3 py-2">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <CheckCircle2 size={16} className="text-success" /> Lesson complete
          </span>
          <Chip tone="count">
            {done}/{labels.length}
          </Chip>
        </div>
      ) : (
        <div className="flex shrink-0 items-baseline justify-between px-4 pt-3">
          <span className="text-sm font-medium">Goals</span>
          <span className="text-xs text-fg-3">Ticks automatically as you work · {done}/{labels.length}</span>
        </div>
      )}
      <ul aria-label="Goals" className="min-h-0 flex-1 overflow-y-auto px-4 py-1">
        {labels.map((g, i) => {
          const body = (
            <>
              {g.passed ? (
                <CheckCircle2 size={18} className="goal-pass mt-0.5 shrink-0 fill-success text-surface" aria-label="Done" />
              ) : (
                <Circle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-edge-2" aria-label="Not done yet" />
              )}
              <span className="min-w-0 flex-1 text-left">{g.label}</span>
            </>
          );
          return (
            <li key={i} className="text-base leading-[22px]">
              {g.question && !g.passed ? (
                <button className="flex min-h-8 w-full items-start gap-2 rounded-sm py-[5px] hover:bg-sunken" onClick={() => showQuestion(g.question!)} title="Show the question">
                  {body}
                </button>
              ) : (
                <div className="flex min-h-8 items-start gap-2 py-[5px]">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 pt-1 pb-3">
        <Button variant="ghost" icon={RotateCcw} onClick={onReset} title="Reset lesson (Alt+Shift+R)">
          Reset lesson
        </Button>
        {view.meta.flags.includes("optional") && !complete && !cat.skipped.includes(view.meta.id) && (
          <Button variant="link" className="text-xs" onClick={() => dispatch(skipLesson(view.meta.id))}>
            Skip lesson
          </Button>
        )}
        {nb.next && (
          <Button variant={complete ? "primary" : "ghost"} onClick={goNext} title="Next lesson (Alt+→)" className="min-w-0">
            <span className="truncate">{complete ? (nextIsNewSection ? "Next section" : `Next: ${nb.next.title}`) : "Next"}</span>
            <ArrowRight size={14} className="shrink-0" />
          </Button>
        )}
      </div>
    </div>
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

