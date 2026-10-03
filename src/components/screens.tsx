// Top bar, git gate, first run, home and section view (DESIGN.md sections 2-3).

import { openUrl } from "@tauri-apps/plugin-opener";
import { Check, CheckCircle2, ChevronLeft, ChevronRight, Circle, ExternalLink, GitBranch, Settings } from "lucide-react";
import { useState } from "react";
import { api, type LessonSummary } from "../api";
import { appActions, loadCatalog, resetProgress, setSetting, useAppDispatch, useAppSelector } from "../store";
import { neighbours, nextLesson, overallProgress, sectionProgress } from "../store/progress";
import { Button, Chip, Dialog, IconButton, ProgressBar } from "./ui";

const LEVELS = ["beginner", "core", "intermediate", "advanced"];

export function TopBar() {
  const dispatch = useAppDispatch();
  const screen = useAppSelector((s) => s.app.screen);
  const cat = useAppSelector((s) => s.catalog.data);
  if (!cat) return null;
  const overall = overallProgress(cat);
  const lesson = screen.kind === "lesson" ? cat.lessons.find((l) => l.id === screen.lesson) : undefined;
  const sectionId = screen.kind === "section" ? screen.section : lesson?.section;
  const section = cat.sections.find((s) => s.id === sectionId);
  const nb = lesson ? neighbours(cat, lesson.id) : null;
  const go = (id: string) => dispatch(appActions.navigate({ kind: "lesson", lesson: id }));

  return (
    <header className="flex h-[var(--size-topbar)] shrink-0 items-center gap-2 border-b border-edge bg-surface px-3">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
        <button className="flex items-center gap-2 rounded-sm px-1 font-semibold hover:underline" onClick={() => dispatch(appActions.navigate({ kind: "home" }))}>
          <GitBranch size={18} strokeWidth={1.75} aria-hidden />
          Canopy
        </button>
        {section && (
          <>
            <ChevronRight size={14} className="text-fg-3" aria-hidden />
            <button className="truncate rounded-sm text-fg-2 hover:text-fg hover:underline" onClick={() => dispatch(appActions.navigate({ kind: "section", section: section.id }))}>
              {section.id} {section.title}
            </button>
          </>
        )}
        {lesson && (
          <>
            <ChevronRight size={14} className="text-fg-3" aria-hidden />
            <span className="truncate" aria-current="page">
              <span className="mr-1.5 font-mono text-xs text-fg-3">{lesson.id}</span>
              {lesson.title}
            </span>
          </>
        )}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        {nb && (
          <div className="mr-2 flex items-center gap-1 text-sm text-fg-2">
            <Button variant="ghost" size="sm" icon={ChevronLeft} disabled={!nb.prev} onClick={() => nb.prev && go(nb.prev.id)} title="Previous lesson (Alt+←)">
              {nb.prev?.id ?? ""}
            </Button>
            <Button variant="ghost" size="sm" disabled={!nb.next} onClick={() => nb.next && go(nb.next.id)} title="Next lesson (Alt+→)">
              {nb.next?.id ?? ""}
              <ChevronRight size={14} />
            </Button>
          </div>
        )}
        <Chip tone="count" className="transition-opacity duration-[var(--dur-base)]">
          <span aria-label={`${overall.done} of ${overall.total} lessons complete`}>
            {overall.done} / {overall.total}
          </span>
        </Chip>
        <IconButton icon={Settings} label="Settings (Ctrl+,)" size={28} onClick={() => dispatch(appActions.openSettings(true))} />
      </div>
    </header>
  );
}

export function GitGate() {
  const dispatch = useAppDispatch();
  const git = useAppSelector((s) => s.app.git);
  const [checking, setChecking] = useState(false);
  const [checkedOnce, setCheckedOnce] = useState(false);
  const recheck = async () => {
    setChecking(true);
    const [g] = await Promise.all([api.gitCheck(), new Promise((r) => setTimeout(r, 400))]);
    dispatch(appActions.setGit(g));
    setChecking(false);
    setCheckedOnce(true);
    if (g.ok) dispatch(appActions.navigate({ kind: "loading" }));
  };
  const tooOld = git?.found && !git.ok;
  return (
    <main className="flex h-full items-center justify-center bg-bg">
      <div className="w-[440px] text-center">
        <GitBranch size={32} className="mx-auto text-fg-2" aria-hidden />
        <h1 className="mt-4 text-xl font-semibold">{tooOld ? "Canopy needs a newer git" : "Canopy needs git to run"}</h1>
        <p className="mt-2 text-base text-fg-2">
          {tooOld
            ? `Canopy needs ${git?.minimum} or newer because the lessons rely on commands added since then.`
            : "Canopy teaches git by running the real thing, and it could not find git on this computer."}
        </p>
        <div className="mt-5 rounded-md border border-edge bg-sunken p-3 text-left font-mono text-xs text-fg-2">
          <div>Looked for: git on PATH</div>
          <div>Found: {git?.version ? `git ${git.version}` : "nothing"}</div>
          {tooOld && <div>Needs: {git?.minimum} or newer</div>}
        </div>
        {checkedOnce && !git?.ok && (
          <p className="mt-3 text-sm text-fg-2">Still not found. If you installed git just now, restart Canopy so it sees the new PATH.</p>
        )}
        <div className="mt-5 flex justify-center gap-3">
          <Button variant="primary" size="lg" icon={ExternalLink} onClick={() => openUrl("https://git-scm.com/downloads")}>
            Get git from git-scm.com
          </Button>
          <Button size="lg" loading={checking} onClick={recheck}>
            {checking ? "Checking…" : "Check again"}
          </Button>
        </div>
      </div>
    </main>
  );
}

export function FirstRun() {
  const dispatch = useAppDispatch();
  const git = useAppSelector((s) => s.app.git);
  const theme = useAppSelector((s) => s.app.settings.theme ?? "system");
  const finish = (lesson: string | null) => {
    dispatch(setSetting({ key: "firstRunDone", value: "1" }));
    dispatch(appActions.navigate(lesson ? { kind: "lesson", lesson } : { kind: "home" }));
  };
  return (
    <main className="flex h-full items-center justify-center bg-bg">
      <div className="w-[640px]">
        <h1 className="text-2xl font-semibold">Welcome to Canopy</h1>
        <p className="mt-2 text-base text-fg-2">
          Learn git by using it. Every command you type runs in real git, inside a learning folder that Canopy creates for you.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-md border border-edge bg-surface p-4">
            <div className="font-medium">Learning folder</div>
            <p className="mt-1 text-sm text-fg-2">Canopy keeps every lesson in its own folder. Your own projects are never touched.</p>
          </div>
          <fieldset className="rounded-md border border-edge bg-surface p-4">
            <legend className="sr-only">Appearance</legend>
            <div className="font-medium">Appearance</div>
            <ThemeRadios value={theme} onChange={(v) => dispatch(setSetting({ key: "theme", value: v }))} />
          </fieldset>
        </div>
        <p className="mt-5 flex items-center gap-2 text-sm text-fg-2">
          <Check size={16} className="text-success" aria-hidden /> git {git?.version} found
        </p>
        <div className="mt-6 flex items-center gap-4">
          <Button variant="primary" size="lg" onClick={() => finish("1.01")}>
            Start with lesson 1.01
          </Button>
          <Button variant="link" onClick={() => finish(null)}>
            Browse all sections
          </Button>
        </div>
      </div>
    </main>
  );
}

export function ThemeRadios({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="mt-2 flex gap-4 text-sm" role="radiogroup" aria-label="Theme">
      {[
        ["system", "Follow system"],
        ["light", "Light"],
        ["dark", "Dark"],
      ].map(([v, label]) => (
        <label key={v} className="flex cursor-pointer items-center gap-1.5">
          <input type="radio" name="theme" className="accent-[var(--color-accent)]" checked={value === v} onChange={() => onChange(v)} />
          {label}
        </label>
      ))}
    </div>
  );
}

export function Home() {
  const dispatch = useAppDispatch();
  const cat = useAppSelector((s) => s.catalog.data)!;
  const overall = overallProgress(cat);
  const next = nextLesson(cat);
  const fresh = overall.done === 0;
  const nextSection = next ? cat.sections.find((s) => s.id === next.section) : null;
  const pct = overall.total ? Math.round((overall.done / overall.total) * 100) : 0;

  return (
    <main className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1040px] px-8 py-8">
        <div className="flex items-baseline justify-between">
          <h1 className="text-base font-medium">Overall progress</h1>
          <span className="text-sm text-fg-2 tabular-nums">
            {overall.done} of {overall.total} · {pct}%
          </span>
        </div>
        <div className="mt-2">
          <ProgressBar done={overall.done} total={overall.total} label="Overall progress" thick />
        </div>

        <section className="mt-6 rounded-md border border-edge bg-surface p-4" aria-label="Continue">
          {next && nextSection ? (
            <>
              <div className="flex justify-between text-sm text-fg-2">
                <span>
                  Section {nextSection.id} · {nextSection.title}
                </span>
                <span className="tabular-nums">
                  {sectionProgress(cat, nextSection.id).done} of {sectionProgress(cat, nextSection.id).total} complete
                </span>
              </div>
              <div className="mt-2 text-2xs font-semibold tracking-[0.06em] text-fg-3 uppercase">{fresh ? "Start here" : "Next up"}</div>
              <div className="mt-1 flex items-center gap-3">
                <span className="font-mono text-sm text-fg-3">{next.id}</span>
                <span className="text-lg font-medium">{next.title}</span>
                <Button variant="primary" size="lg" className="ml-auto" onClick={() => dispatch(appActions.navigate({ kind: "lesson", lesson: next.id }))}>
                  {fresh ? "Start" : "Continue"} <ChevronRight size={16} />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-medium">All {overall.total} lessons complete.</div>
                <p className="text-sm text-fg-2">Everything in Canopy is done. Redo any lesson whenever you like; your progress stays.</p>
              </div>
            </div>
          )}
        </section>

        {LEVELS.map((level) => {
          const sections = cat.sections.filter((s) => s.level === level);
          if (!sections.length) return null;
          return (
            <section key={level} className="mt-8" aria-label={level}>
              <h2 className="text-2xs font-semibold tracking-[0.06em] text-fg-3 uppercase">{level}</h2>
              <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
                {sections.map((s) => {
                  const p = sectionProgress(cat, s.id);
                  const current = nextSection?.id === s.id;
                  const stateText = p.state === "complete" ? "Complete" : p.state === "not-started" ? "Not started" : `${p.done} of ${p.total}`;
                  return (
                    <button
                      key={s.id}
                      onClick={() => dispatch(appActions.navigate({ kind: "section", section: s.id }))}
                      aria-label={`Section ${s.id}, ${s.title}, ${p.done} of ${p.total} complete${current ? ", current section" : ""}`}
                      className={`rounded-md border border-edge bg-surface p-4 text-left transition-colors duration-[var(--dur-fast)] hover:border-edge-2 hover:bg-raised ${
                        current ? "border-l-2 border-l-accent" : ""
                      }`}
                    >
                      <div className="flex items-baseline gap-2 text-sm font-medium">
                        <span className="font-mono text-fg-3">{s.id}</span>
                        <span className="truncate">{s.title}</span>
                        {current && <Circle size={7} className="shrink-0 fill-accent text-accent" aria-hidden />}
                      </div>
                      <div className={`mt-1 flex items-center gap-1 text-xs ${p.state === "complete" ? "text-success" : "text-fg-2"}`}>
                        {p.state === "complete" && <Check size={12} aria-hidden />}
                        {current && p.state !== "complete" ? `Continue · ${stateText}` : stateText}
                      </div>
                      <div className="mt-3">
                        <ProgressBar done={p.done} total={p.total} label={`Section ${s.id} progress`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}

        <footer className="mt-10 text-xs text-fg-3">
          Lessons {cat.manifest.contentVersion} ·{" "}
          <button className="hover:underline" onClick={() => dispatch(appActions.openSettings(true))}>
            Check for updates
          </button>
        </footer>
      </div>
    </main>
  );
}

export function SectionView({ sectionId }: { sectionId: number }) {
  const dispatch = useAppDispatch();
  const cat = useAppSelector((s) => s.catalog.data)!;
  const [confirm, setConfirm] = useState(false);
  const section = cat.sections.find((s) => s.id === sectionId);
  if (!section) return null;
  const lessons = cat.lessons.filter((l) => l.section === sectionId);
  const p = sectionProgress(cat, sectionId);
  const next = nextLesson(cat);
  const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
  return (
    <main className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[880px] px-8 py-8">
        <div className="text-2xs font-semibold tracking-[0.06em] text-fg-3 uppercase">
          {section.level} · Section {section.id}
        </div>
        <h1 className="mt-1 text-2xl font-semibold">{section.title}</h1>
        <p className="mt-1 text-base text-fg-2">{section.summary}</p>
        <div className="mt-4 flex items-center gap-4">
          <span className="shrink-0 text-sm text-fg-2 tabular-nums">
            {p.done} of {p.total} · {pct}%
          </span>
          <ProgressBar done={p.done} total={p.total} label={`Section ${section.id} progress`} />
          {p.done > 0 && (
            <Button variant="danger-ghost" onClick={() => setConfirm(true)}>
              Reset progress
            </Button>
          )}
        </div>
        {p.state === "complete" && (
          <p className="mt-4 text-sm text-fg-2">
            <span className="font-medium text-fg">Section complete.</span> Every lesson here is done. Redo any lesson at any time; progress stays.
          </p>
        )}
        <ul className="mt-6" aria-label="Lessons">
          {lessons.map((l) => (
            <LessonRow key={l.id} lesson={l} done={Boolean(cat.completed[l.id])} skipped={cat.skipped.includes(l.id)} isNext={next?.id === l.id} onOpen={() => dispatch(appActions.navigate({ kind: "lesson", lesson: l.id }))} />
          ))}
        </ul>
      </div>
      {confirm && (
        <Dialog
          title={`Reset progress for Section ${section.id}?`}
          onClose={() => setConfirm(false)}
          actions={
            <>
              <Button variant="ghost" data-autofocus onClick={() => setConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  setConfirm(false);
                  await dispatch(resetProgress(section.id));
                }}
              >
                Reset progress
              </Button>
            </>
          }
        >
          {p.done} {p.done === 1 ? "lesson" : "lessons"} will be marked as not complete. Lesson folders are not touched.
        </Dialog>
      )}
    </main>
  );
}

function LessonRow({ lesson, done, skipped, isNext, onOpen }: { lesson: LessonSummary; done: boolean; skipped: boolean; isNext: boolean; onOpen: () => void }) {
  const kind = lesson.kind[0].toUpperCase() + lesson.kind.slice(1);
  return (
    <li>
      <button
        onClick={onOpen}
        className={`grid h-10 w-full grid-cols-[24px_48px_1fr_auto_auto] items-center gap-2 rounded-sm px-3 text-left text-sm hover:bg-sunken ${isNext ? "bg-sunken" : ""}`}
      >
        {skipped ? (
          <span title="Skipped. Counts as done." className="relative inline-flex">
            <Circle size={16} className="text-fg-3" aria-label="Skipped" />
            <Check size={9} strokeWidth={3} className="absolute top-[3.5px] left-[3.5px] text-fg-3" aria-hidden />
          </span>
        ) : done ? <CheckCircle2 size={16} className="fill-success text-surface" aria-label="Complete" /> : <Circle size={16} className="text-edge-2" aria-label="Not complete" />}
        <span className="font-mono text-xs text-fg-3">{lesson.id}</span>
        <span className={`truncate ${isNext ? "font-medium" : ""}`}>{lesson.title}</span>
        <span className="flex gap-1.5">
          {isNext && <span className="text-xs font-medium text-accent">Next</span>}
          {lesson.flags.includes("destructive") && <Chip tone="warning">Destructive</Chip>}
          {lesson.flags.includes("guided") && <Chip tone="outline">Guided</Chip>}
          {lesson.flags.includes("optional") && <Chip tone="outline">Optional</Chip>}
          {lesson.needsNewerGit && <Chip tone="warning">Needs git {lesson.minGit}</Chip>}
        </span>
        <Chip>{kind}</Chip>
      </button>
    </li>
  );
}

export async function reloadCatalog(dispatch: ReturnType<typeof useAppDispatch>) {
  await dispatch(loadCatalog());
}
