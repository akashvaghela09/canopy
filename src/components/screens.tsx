// Top bar, git gate, first run, home and section view (DESIGN.md sections 2-3).

import { openUrl } from "@tauri-apps/plugin-opener";
import { Check, CheckCircle2, ChevronDown, ChevronRight, Circle, ExternalLink,  Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api, type LessonSummary } from "../api";
import { appActions, go, loadCatalog, resetProgress, setSetting, useAppDispatch, useAppSelector } from "../store";
import { nextLesson, overallProgress, sectionProgress } from "../store/progress";
import { Button, Chip, Dialog, IconButton, ProgressBar } from "./ui";

const LEVELS = ["beginner", "core", "intermediate", "advanced"];
const LEVEL_NAMES: Record<string, string> = { beginner: "Beginner", core: "Everyday", intermediate: "Intermediate", advanced: "Advanced" };

const crumb = "flex h-7 min-w-0 items-center gap-1.5 rounded-sm px-2 text-fg-2 transition-colors hover:bg-sunken hover:text-fg";

/** Breadcrumb navigation: Home › Section › Lesson ▾ (REVIEW_2.md item 4). */
export function TopBar() {
  const dispatch = useAppDispatch();
  const screen = useAppSelector((s) => s.app.screen);
  const cat = useAppSelector((s) => s.catalog.data);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "l" || e.key === "L") && screen.kind === "lesson") {
        e.preventDefault();
        setMenuOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen.kind]);
  useEffect(() => setMenuOpen(false), [screen]);
  if (!cat) return null;
  const lesson = screen.kind === "lesson" ? cat.lessons.find((l) => l.id === screen.lesson) : undefined;
  const sectionId = screen.kind === "section" ? screen.section : lesson?.section;
  const section = cat.sections.find((s) => s.id === sectionId);

  return (
    <header className="relative flex h-[var(--size-topbar)] shrink-0 items-center gap-1 border-b border-edge bg-surface px-2">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-0.5 text-sm">
        <button className={`${crumb} font-semibold text-fg`} onClick={() => dispatch(go({ kind: "home" }))} title="Home (Alt+Home)">
          <img src="/icon.svg" alt="" width={18} height={18} />
          Canopy
        </button>
        {section && (
          <>
            <ChevronRight size={14} className="shrink-0 text-fg-3" aria-hidden />
            <button className={crumb} onClick={() => dispatch(go({ kind: "section", section: section.id }))} title="All lessons in this section">
              <span className="truncate">
                {section.id} · {section.title}
              </span>
            </button>
          </>
        )}
        {lesson && (
          <>
            <ChevronRight size={14} className="shrink-0 text-fg-3" aria-hidden />
            <button className={`${crumb} text-fg`} aria-haspopup="listbox" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)} title="Lessons in this section (Alt+L)">
              <span className="font-mono text-xs text-fg-3">{lesson.id}</span>
              <span className="truncate">{lesson.title}</span>
              <ChevronDown size={14} className="shrink-0 text-fg-3" />
            </button>
          </>
        )}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <IconButton icon={Settings} label="Settings (Ctrl+,)" size={28} onClick={() => dispatch(appActions.openSettings(true))} />
      </div>
      {menuOpen && lesson && section && <LessonMenu current={lesson.id} sectionId={section.id} onClose={() => setMenuOpen(false)} />}
    </header>
  );
}

/** The lessons of this section, with their state; pick one to go there. */
function LessonMenu({ current, sectionId, onClose }: { current: string; sectionId: number; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const cat = useAppSelector((s) => s.catalog.data)!;
  const section = cat.sections.find((s) => s.id === sectionId)!;
  const lessons = cat.lessons.filter((l) => l.section === sectionId);
  const p = sectionProgress(cat, sectionId);
  const [filter, setFilter] = useState("");
  const [active, setActive] = useState(() => Math.max(0, lessons.findIndex((l) => l.id === current)));
  const shown = lessons.filter((l) => !filter || `${l.id} ${l.title}`.toLowerCase().includes(filter.toLowerCase()));
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    list.current?.focus();
    const outside = (e: PointerEvent) => {
      if (!list.current?.parentElement?.contains(e.target as Node)) onClose();
    };
    window.addEventListener("pointerdown", outside);
    return () => window.removeEventListener("pointerdown", outside);
  }, [onClose]);
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);
  const pick = (id: string) => {
    onClose();
    if (id !== current) dispatch(go({ kind: "lesson", lesson: id }));
  };
  return (
    <div className="absolute top-[calc(var(--size-topbar)-4px)] left-40 z-40 w-[22.5rem] rounded-md border border-edge-2 bg-raised shadow-[0_4px_12px_oklch(0%_0_0/0.12)] dark:shadow-[0_4px_12px_oklch(0%_0_0/0.4)]">
      <div className="flex items-center justify-between border-b border-edge px-3 py-2 text-sm text-fg-2">
        <span>
          {section.title} · {p.done} of {p.total} complete
        </span>
        <button
          className="text-xs text-accent hover:underline"
          onClick={() => {
            onClose();
            dispatch(go({ kind: "section", section: sectionId }));
          }}
        >
          Section page
        </button>
      </div>
      <div
        ref={list}
        tabIndex={-1}
        role="listbox"
        aria-label={`Lessons in ${section.title}`}
        className="max-h-[60vh] overflow-y-auto py-1 outline-none"
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(shown.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === "Enter" && shown[active]) {
            pick(shown[active].id);
          } else if (e.key === "Escape") {
            onClose();
          } else if (e.key === "Backspace") {
            setFilter((f) => f.slice(0, -1));
            setActive(0);
          } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey) {
            setFilter((f) => f + e.key);
            setActive(0);
          }
        }}
      >
        {filter && <div className="px-3 py-1 text-xs text-fg-3">Filter: {filter}</div>}
        {shown.map((l, i) => {
          const done = Boolean(cat.completed[l.id]);
          const skipped = cat.skipped.includes(l.id);
          return (
            <button
              key={l.id}
              data-i={i}
              role="option"
              aria-selected={l.id === current}
              onClick={() => pick(l.id)}
              onMouseEnter={() => setActive(i)}
              className={`flex h-8 w-full items-center gap-2 border-l-2 px-3 text-left text-sm ${l.id === current ? "border-accent bg-sunken" : "border-transparent"} ${i === active ? "bg-sunken" : ""}`}
            >
              {skipped ? (
                <Circle size={15} className="shrink-0 text-fg-3" aria-label="Skipped" />
              ) : done ? (
                <CheckCircle2 size={15} className="shrink-0 fill-success text-surface" aria-label="Complete" />
              ) : (
                <Circle size={15} className="shrink-0 text-edge-2" aria-label="Not complete" />
              )}
              <span className="w-10 shrink-0 font-mono text-xs text-fg-3">{l.id}</span>
              <span className="truncate">{l.title}</span>
            </button>
          );
        })}
      </div>
    </div>
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
    if (g.ok) dispatch(go({ kind: "loading" }));
  };
  const tooOld = git?.found && !git.ok;
  return (
    <main className="flex h-full items-center justify-center bg-bg">
      <div className="w-[440px] text-center">
        <img src="/icon.svg" alt="" width={56} height={56} className="mx-auto" />
        <h1 className="mt-4 text-xl font-semibold">{tooOld ? "Canopy needs a newer git" : "Canopy needs git to run"}</h1>
        <p className="mt-2 text-base text-fg-2">
          {tooOld
            ? `Canopy needs ${git?.minimum} or newer because the lessons rely on commands added since then.`
            : "Canopy teaches git by running the real thing, and it could not find git on this computer."}
        </p>
        {tooOld && (
          <div className="mt-5 rounded-md border border-edge bg-sunken p-3 text-left font-mono text-xs text-fg-2">
            <div>Found: git {git?.version}</div>
            <div>Needs: {git?.minimum} or newer</div>
          </div>
        )}
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
  const [folder, setFolder] = useState("");
  useEffect(() => {
    api.learningFolder().then(setFolder, () => {});
  }, []);
  const finish = (lesson: string | null) => {
    dispatch(setSetting({ key: "firstRunDone", value: "1" }));
    dispatch(go(lesson ? { kind: "lesson", lesson } : { kind: "home" }));
  };
  return (
    <main className="flex h-full items-center justify-center bg-bg">
      <div className="w-[560px]">
        <img src="/icon.svg" alt="" width={64} height={64} className="mb-5" />
        <h1 className="text-2xl font-semibold">Welcome to Canopy</h1>
        <p className="mt-3 text-base text-fg-2">
          Learn git by using it. Every command you type runs in real git, inside lesson folders Canopy creates
          {folder ? (
            <>
              {" "}
              in <code className="selectable rounded-sm bg-sunken px-1 font-mono text-sm">{folder}</code>
            </>
          ) : null}
          . Your own projects are never touched.
        </p>
        <p className="mt-4 flex items-center gap-2 text-sm text-fg-2">
          <Check size={16} className="text-success" aria-hidden /> git {git?.version} found
        </p>
        <div className="mt-6 flex items-center gap-4">
          <Button variant="primary" size="lg" onClick={() => finish("1.01")}>
            Start the first lesson
          </Button>
          <Button variant="link" onClick={() => finish(null)}>
            Browse all lessons
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
  const cat = useAppSelector((s) => s.catalog.data)!;
  const dispatch = useAppDispatch();
  const overall = overallProgress(cat);
  const next = nextLesson(cat);
  const pct = overall.total ? Math.round((overall.done / overall.total) * 100) : 0;
  const allDone = overall.done === overall.total && overall.total > 0;

  return (
    <main className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1120px] px-8 pt-10 pb-12">
        {/* Hero: what Canopy is, and overall progress once there is some. */}
        <header className="flex items-start gap-4">
          <img src="/icon.svg" alt="" width={40} height={40} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h1 className="text-2xl font-semibold">Canopy</h1>
              <p className="text-lg text-fg-2">Learn git by using it.</p>
            </div>
            <p className="mt-1 max-w-[720px] text-sm text-fg-3">
              {cat.lessons.length} hands-on lessons in {cat.sections.length} sections. Every command you type runs in real git, right here on your computer.
            </p>
          </div>
          {overall.done > 0 && (
            <div className="w-[220px] shrink-0 pt-1 text-right">
              <div className={`text-sm tabular-nums ${allDone ? "text-success" : "text-fg-2"}`}>
                {allDone ? `All ${overall.total} lessons complete` : `${overall.done} of ${overall.total} lessons · ${pct}%`}
              </div>
              <div className="mt-2">
                <ProgressBar done={overall.done} total={overall.total} label="Overall progress" thick />
              </div>
            </div>
          )}
        </header>

        <PathStrip current={next?.section ?? null} />
        <UpNextCard />

        {LEVELS.map((level) => {
          const sections = cat.sections.filter((s) => s.level === level);
          if (!sections.length) return null;
          return (
            <section key={level} className="mt-8" aria-labelledby={`level-${level}`}>
              <div className="flex h-10 items-baseline gap-3 border-b border-edge pt-2">
                <h2 id={`level-${level}`} className="text-sm font-semibold">
                  {LEVEL_NAMES[level] ?? level}
                </h2>
                <span className="truncate text-sm text-fg-3">{LEVEL_BLURB[level]}</span>
              </div>
              <ul className="divide-y divide-edge">
                {sections.map((sec) => (
                  <li key={sec.id}>
                    <SectionRow id={sec.id} title={sec.title} summary={sec.summary} current={next?.section === sec.id} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <footer className="mt-8">
          <button className="text-xs text-fg-3 hover:text-fg hover:underline" onClick={() => dispatch(appActions.openShortcuts(true))}>
            Keyboard shortcuts · Ctrl+/
          </button>
        </footer>
      </div>
    </main>
  );
}

const LEVEL_BLURB: Record<string, string> = {
  beginner: "Your first commands, commits, and a safe way to undo.",
  core: "Branches, merges, remotes, and parking unfinished work.",
  intermediate: "Rewrite history, recover from mistakes, investigate, and work with a team.",
  advanced: "Configure git, look inside it, and use its specialist tools.",
};

type NodeState = "not-started" | "in-progress" | "complete";

/** The section glyph shared by the path strip and the rows (HOME_SPEC 5, 7). */
function SectionNode({ id, state, current, size }: { id: number; state: NodeState; current: boolean; size: 12 | 24 }) {
  const big = size === 24;
  const look =
    state === "complete"
      ? "bg-success border-success"
      : current
        ? "bg-accent border-accent"
        : state === "in-progress"
          ? "bg-surface border-accent"
          : "bg-surface border-edge-2";
  return (
    <span aria-hidden className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      {current && !big && <span className="absolute -inset-1.5 rounded-full bg-[var(--color-graph-highlight)]" />}
      <span
        className={`relative flex items-center justify-center rounded-full ${look} ${big ? "border-[1.5px]" : "border-2"}`}
        style={{ width: size, height: size }}
      >
        {big &&
          (state === "complete" ? (
            <Check size={14} strokeWidth={2.5} className="text-surface" />
          ) : (
            <span className={`font-mono text-2xs ${current ? "text-accent-fg" : state === "in-progress" ? "text-accent" : "text-fg-3"}`}>{id}</span>
          ))}
      </span>
    </span>
  );
}

const stateText = (p: { done: number; total: number; state: NodeState }) =>
  p.state === "complete" ? "complete" : p.state === "in-progress" ? `${p.done} of ${p.total} lessons complete` : "not started";

/** 15 sections as a tiny commit graph, grouped by level (HOME_SPEC 5). */
function PathStrip({ current }: { current: number | null }) {
  const dispatch = useAppDispatch();
  const cat = useAppSelector((s) => s.catalog.data)!;
  const all = cat.sections;
  const [active, setActive] = useState(() => Math.max(0, all.findIndex((s) => s.id === current)));
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (i: number) => {
    const n = (i + all.length) % all.length;
    setActive(n);
    refs.current[n]?.focus();
  };
  const groups = LEVELS.map((level) => all.filter((s) => s.level === level)).filter((g) => g.length > 0);
  return (
    <div
      role="group"
      aria-label="Learning path"
      className="mt-8 grid gap-10"
      style={{ gridTemplateColumns: groups.map((g) => `${g.length}fr`).join(" ") }}
      onKeyDown={(e) => {
        const to = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: all.length - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        move(to);
      }}
    >
      {groups.map((g) => (
        <div key={g[0].level}>
          <div className="mb-2 text-2xs font-semibold tracking-[0.06em] text-fg-3 uppercase">{LEVEL_NAMES[g[0].level] ?? g[0].level}</div>
          <div className="relative flex justify-between">
            {g.map((sec, i) => {
              const p = sectionProgress(cat, sec.id);
              const idx = all.indexOf(sec);
              const nextDone = i < g.length - 1 && p.state === "complete" && sectionProgress(cat, g[i + 1].id).state === "complete";
              const label = `Section ${sec.id}, ${sec.title}, ${stateText(p)}`;
              return (
                <div key={sec.id} className="relative flex flex-1 flex-col items-start last:flex-none">
                  {/* connector to the next node in this level */}
                  {i < g.length - 1 && <span aria-hidden className={`absolute top-[11px] right-0 left-3 h-0.5 ${nextDone ? "bg-success" : "bg-edge"}`} />}
                  <button
                    ref={(el) => {
                      refs.current[idx] = el;
                    }}
                    tabIndex={idx === active ? 0 : -1}
                    aria-label={label}
                    title={label}
                    onFocus={() => setActive(idx)}
                    onClick={() => dispatch(go({ kind: "section", section: sec.id }))}
                    className="group relative flex flex-col items-center gap-1.5 rounded-sm"
                  >
                    <span className="flex size-6 items-center justify-center">
                      <SectionNode id={sec.id} state={p.state} current={sec.id === current} size={12} />
                    </span>
                    <span className="font-mono text-2xs text-fg-3 group-hover:text-fg">{sec.id}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** The one card on the page: what to do next (HOME_SPEC 6). */
function UpNextCard() {
  const dispatch = useAppDispatch();
  const cat = useAppSelector((s) => s.catalog.data)!;
  const overall = overallProgress(cat);
  const next = nextLesson(cat);
  const card = "mt-10 rounded-md border border-edge bg-surface px-6 py-5 dark:border-edge-2";
  const eyebrow = "text-2xs font-semibold tracking-[0.06em] uppercase";
  if (!next) {
    return (
      <section className={card} aria-label="Up next">
        <div className={`${eyebrow} text-success`}>All lessons complete</div>
        <div className="mt-2 flex items-center gap-2">
          <CheckCircle2 size={20} className="text-success" aria-hidden />
          <span className="text-xl font-semibold">All {overall.total} lessons complete.</span>
        </div>
        <p className="mt-1 text-sm text-fg-2">Redo any lesson whenever you like; your progress stays.</p>
      </section>
    );
  }
  const sec = cat.sections.find((s) => s.id === next.section)!;
  const sp = sectionProgress(cat, sec.id);
  const fresh = overall.done === 0;
  const newSection = !fresh && sp.done === 0;
  const prevComplete = newSection && sec.id > 1 && sectionProgress(cat, sec.id - 1).state === "complete";
  const label = fresh ? "Start here" : prevComplete ? `Section ${sec.id - 1} complete · next` : "Up next";
  const button = fresh ? "Start" : newSection ? `Start section ${sec.id}` : "Continue";
  return (
    <section className={card} aria-label="Up next">
      <div className="flex items-baseline justify-between gap-4">
        <div className={`${eyebrow} text-accent`}>{label}</div>
        <button className="flex items-center gap-1 text-sm text-fg-2 tabular-nums hover:text-fg hover:underline" onClick={() => dispatch(go({ kind: "section", section: sec.id }))}>
          Section {sec.id} · {sec.title} · {sp.done > 0 ? `${sp.done} of ${sp.total}` : `${sp.total} lessons`}
          <ChevronRight size={14} aria-hidden />
        </button>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <span className="font-mono text-sm text-fg-3">{next.id}</span>
        <span className="min-w-0 flex-1 truncate text-xl font-semibold">{next.title}</span>
        <Button variant="primary" size="lg" onClick={() => dispatch(go({ kind: "lesson", lesson: next.id }))}>
          {button} <ChevronRight size={16} />
        </Button>
      </div>
      <p className="mt-1 truncate text-sm text-fg-2">{sec.summary}</p>
      {newSection && <p className="mt-1 text-sm text-fg-3">{sp.total} lessons in this section.</p>}
    </section>
  );
}

/** One syllabus row: node, title, summary, state, bar (in progress only). */
function SectionRow({ id, title, summary, current }: { id: number; title: string; summary: string; current: boolean }) {
  const dispatch = useAppDispatch();
  const cat = useAppSelector((s) => s.catalog.data)!;
  const p = sectionProgress(cat, id);
  const state = p.state === "complete" ? "Complete" : p.state === "in-progress" ? `${p.done} of ${p.total}` : `${p.total} lessons`;
  return (
    <button
      onClick={() => dispatch(go({ kind: "section", section: id }))}
      aria-label={`Section ${id}, ${title}, ${stateText(p)}${current ? ", current section" : ""}`}
      className={`group grid h-14 w-full grid-cols-[32px_minmax(180px,220px)_1fr_120px_96px_16px] items-center gap-4 px-3 text-left transition-colors hover:bg-sunken ${
        current ? "border-l-2 border-l-accent pl-[10px]" : ""
      }`}
    >
      <SectionNode id={id} state={p.state} current={current} size={24} />
      <span className="truncate text-sm font-medium">{title}</span>
      <span className="truncate text-sm text-fg-2">{summary}</span>
      <span className={`text-right text-sm tabular-nums ${p.state === "complete" ? "text-success" : p.state === "in-progress" ? "text-fg-2" : "text-fg-3"}`}>{state}</span>
      <span>{p.state === "in-progress" && <ProgressBar done={p.done} total={p.total} label={`Section ${id} progress`} />}</span>
      <ChevronRight size={16} aria-hidden className="text-edge-2 group-hover:text-fg-3" />
    </button>
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
  // Continue here: the overall next lesson if it is in this section, else this section's first incomplete one.
  const resume = next?.section === sectionId ? next : (lessons.find((l) => !cat.completed[l.id]) ?? null);
  return (
    <main className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[880px] px-8 py-8">
        <div className="text-2xs font-semibold tracking-[0.06em] text-fg-3 uppercase">
          {LEVEL_NAMES[section.level] ?? section.level} · Section {section.id}
        </div>
        <h1 className="mt-1 text-2xl font-semibold">{section.title}</h1>
        <p className="mt-1 text-base text-fg-2">{section.summary}</p>
        <div className="mt-4 flex items-center gap-4">
          {p.done === 0 ? (
            <span className="text-sm text-fg-3 tabular-nums">{p.total} lessons</span>
          ) : (
            <>
              <span className="shrink-0 text-sm text-fg-2 tabular-nums">
                {p.done} of {p.total} · {pct}%
              </span>
              <ProgressBar done={p.done} total={p.total} label={`Section ${section.id} progress`} />
            </>
          )}
          {resume && (
            <Button variant="primary" size="lg" className="ml-auto shrink-0" onClick={() => dispatch(go({ kind: "lesson", lesson: resume.id }))}>
              {p.done === 0 ? "Start" : "Continue"} <ChevronRight size={16} />
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
            <LessonRow key={l.id} lesson={l} done={Boolean(cat.completed[l.id])} skipped={cat.skipped.includes(l.id)} isNext={next?.id === l.id} onOpen={() => dispatch(go({ kind: "lesson", lesson: l.id }))} />
          ))}
        </ul>
        {p.done > 0 && (
          <div className="mt-8 text-right">
            <button className="text-xs text-fg-3 hover:text-fg hover:underline" onClick={() => setConfirm(true)}>
              Reset progress for this section
            </button>
          </div>
        )}
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
  return (
    <li>
      <button
        onClick={onOpen}
        className={`grid h-10 w-full grid-cols-[24px_48px_1fr_auto] items-center gap-2 rounded-sm px-3 text-left text-sm hover:bg-sunken ${isNext ? "bg-sunken" : ""}`}
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
          {lesson.flags.includes("optional") && <Chip tone="outline">Optional</Chip>}
          {lesson.needsNewerGit && <Chip tone="warning">Needs git {lesson.minGit}</Chip>}
        </span>
      </button>
    </li>
  );
}

export async function reloadCatalog(dispatch: ReturnType<typeof useAppDispatch>) {
  await dispatch(loadCatalog());
}
