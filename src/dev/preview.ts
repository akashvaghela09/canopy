// Browser preview mode: when the page is not running inside Tauri, answer
// IPC calls from JSON produced by `canopy-lesson preview <id>` (see
// tools/preview.sh). For screenshots and visual review only.
//
// URL parameters: ?lesson=2.03&screen=lesson|home|section|firstRun&section=2
//   &theme=light|dark&completed=<id>&settings=1 (open the settings sheet)

import { emit } from "@tauri-apps/api/event";
import { mockIPC } from "@tauri-apps/api/mocks";

type PreviewData = {
  catalog: unknown;
  lesson: unknown;
  update: unknown;
  transcript: string;
  files: Record<string, unknown[]>;
};

export async function setupPreview(): Promise<boolean> {
  if ("__TAURI_INTERNALS__" in window && !(window as { __CANOPY_PREVIEW__?: boolean }).__CANOPY_PREVIEW__) return false;
  const params = new URLSearchParams(location.search);
  const lessonId = params.get("lesson") ?? "2.03";
  const res = await fetch(`/preview/${lessonId}.json`);
  const data: PreviewData = await res.json();
  const screen = params.get("screen") ?? "lesson";
  const settings: Record<string, string> = { theme: params.get("theme") ?? "system" };
  if (screen !== "firstRun") settings.firstRunDone = "1";
  if (params.get("completed")) {
    const c = data.catalog as { completed: Record<string, number>; lessons: { id: string }[] };
    const upTo = params.get("completed")!;
    const key = (id: string) => id.split(".").map(Number);
    const [us, un] = key(upTo);
    for (const l of c.lessons) {
      const [s, n] = key(l.id);
      if (s < us || (s === us && n <= un)) c.completed[l.id] = Date.now();
    }
  }
  (window as { __CANOPY_PREVIEW__?: boolean }).__CANOPY_PREVIEW__ = true;

  mockIPC(
    (cmd, args) => {
      const a = (args ?? {}) as Record<string, unknown>;
      switch (cmd) {
        case "git_check":
          return { found: true, version: "2.43.0", minimum: "2.32.0", ok: true };
        case "get_settings":
          return settings;
        case "set_setting":
          settings[a.key as string] = a.value as string;
          return null;
        case "get_catalog":
          return data.catalog;
        case "get_lesson":
          return data.lesson;
        case "start_lesson":
          (window as { __canopyPreviewOutput?: string }).__canopyPreviewOutput = data.transcript.replace(/\n/g, "\r\n");
          setTimeout(() => emit("lesson-update", data.update), 150);
          return { lessonId, root: "/preview", fresh: false };
        case "list_dir":
          return data.files[(a.path as string) ?? ""] ?? [];
        case "read_file":
          return "(file contents are not available in preview mode)";
        case "repo_diff":
          return "";
        case "three_areas":
          return [];
        default:
          return null;
      }
    },
    { shouldMockEvents: true },
  );
  (window as { __canopyPreviewScreen?: string }).__canopyPreviewScreen = screen;
  return true;
}
