import { describe, expect, it } from "vitest";
import type { CatalogView, LessonSummary } from "../api";
import { missingRecommended, nextLesson, sectionProgress } from "./progress";

const lesson = (id: string, recommended: string[] = []): LessonSummary =>
  ({ id, section: Number(id.split(".")[0]), title: id, recommended } as unknown as LessonSummary);

const cat = (completed: Record<string, number>): CatalogView => ({
  manifest: { formatVersion: 1, contentVersion: "x" },
  sections: [],
  lessons: [lesson("1.01"), lesson("1.02"), lesson("1.03", ["1.01"]), lesson("2.01")],
  completed,
  skipped: [],
});

describe("progress", () => {
  it("starts at the first lesson", () => {
    expect(nextLesson(cat({}))!.id).toBe("1.01");
  });
  it("continues after the most recently completed lesson", () => {
    expect(nextLesson(cat({ "1.01": 1, "1.03": 5 }))!.id).toBe("2.01");
  });
  it("wraps to the lowest incomplete lesson", () => {
    expect(nextLesson(cat({ "2.01": 9 }))!.id).toBe("1.01");
  });
  it("returns null when everything is complete", () => {
    expect(nextLesson(cat({ "1.01": 1, "1.02": 1, "1.03": 1, "2.01": 1 }))).toBeNull();
  });
  it("counts section progress", () => {
    expect(sectionProgress(cat({ "1.01": 1 }), 1)).toEqual({ done: 1, total: 3, state: "in-progress" });
  });
  it("lists only incomplete recommended lessons", () => {
    expect(missingRecommended(cat({}), "1.03").map((l) => l.id)).toEqual(["1.01"]);
    expect(missingRecommended(cat({ "1.01": 1 }), "1.03")).toEqual([]);
  });
});
