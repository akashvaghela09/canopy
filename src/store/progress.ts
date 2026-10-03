// Progress is derived from the completed set and the lesson index, never stored
// (docs/ARCHITECTURE.md 4.7).

import type { CatalogView, LessonSummary } from "../api";

export type SectionProgress = { done: number; total: number; state: "not-started" | "in-progress" | "complete" };

export function sectionProgress(cat: CatalogView, section: number): SectionProgress {
  const lessons = cat.lessons.filter((l) => l.section === section);
  const done = lessons.filter((l) => cat.completed[l.id]).length;
  const total = lessons.length;
  return { done, total, state: done === 0 ? "not-started" : done === total ? "complete" : "in-progress" };
}

export function overallProgress(cat: CatalogView): { done: number; total: number } {
  return { done: cat.lessons.filter((l) => cat.completed[l.id]).length, total: cat.lessons.length };
}

/**
 * Next lesson (DESIGN.md 3.3): the lowest-id incomplete lesson after the most
 * recently completed one, else the lowest-id incomplete lesson overall.
 */
export function nextLesson(cat: CatalogView): LessonSummary | null {
  const incomplete = cat.lessons.filter((l) => !cat.completed[l.id]);
  if (incomplete.length === 0) return null;
  let latestId: string | null = null;
  let latestAt = -1;
  for (const [id, at] of Object.entries(cat.completed)) {
    if (at > latestAt) {
      latestAt = at;
      latestId = id;
    }
  }
  if (latestId !== null) {
    const idx = cat.lessons.findIndex((l) => l.id === latestId);
    const after = cat.lessons.slice(idx + 1).find((l) => !cat.completed[l.id]);
    if (after) return after;
  }
  return incomplete[0];
}

export function neighbours(cat: CatalogView, id: string): { prev: LessonSummary | null; next: LessonSummary | null } {
  const i = cat.lessons.findIndex((l) => l.id === id);
  return { prev: i > 0 ? cat.lessons[i - 1] : null, next: i >= 0 && i < cat.lessons.length - 1 ? cat.lessons[i + 1] : null };
}

/** Recommended lessons the learner has not completed yet. */
export function missingRecommended(cat: CatalogView, id: string): LessonSummary[] {
  const lesson = cat.lessons.find((l) => l.id === id);
  if (!lesson) return [];
  return lesson.recommended
    .filter((r) => !cat.completed[r])
    .map((r) => cat.lessons.find((l) => l.id === r))
    .filter((l): l is LessonSummary => Boolean(l));
}

/** "concept-three-areas" -> "three areas"; "log-oneline" -> "log oneline". */
export function humanizeSkill(skill: string): string {
  return skill.replace(/^concept-/, "").replace(/-/g, " ");
}
