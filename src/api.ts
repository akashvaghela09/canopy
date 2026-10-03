// Typed wrappers around the Tauri commands in src-tauri/src/commands.rs.

import { Channel, invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { Snapshot } from "./graph/types";

export type LessonKind = "practice" | "concept" | "boss";

export type LessonMeta = {
  id: string;
  section: number;
  title: string;
  kind: LessonKind;
  teaches: string[];
  requires: string[];
  flags: string[];
  minGit: string | null;
  tools: string[];
  identity: boolean;
  repo: string | null;
  start: string;
  repos: { path: string; label: string }[];
  panels: string[];
  actions: { id: string; label: string; script: string }[];
  hints: string[];
};

export type LessonSummary = LessonMeta & { recommended: string[]; needsNewerGit: boolean };

export type Section = { id: number; slug: string; title: string; level: string; summary: string };

export type CatalogView = {
  manifest: { formatVersion: number; contentVersion: string };
  sections: Section[];
  lessons: LessonSummary[];
  completed: Record<string, number>;
  skipped: string[];
};

export type PublicQuestion =
  | { id: string; prompt: string; type: "choice"; options: string[]; multiple: boolean }
  | { id: string; prompt: string; type: "text" | "number" | "commit" };

export type LessonView = {
  meta: LessonMeta;
  content: string;
  questions: PublicQuestion[];
  goals: string[];
  answers: Record<string, { value: unknown; correct: boolean }>;
  actions: { id: string; label: string; script: string; source: string }[];
  recommended: string[];
  hasAttempt: boolean;
};

export type GoalResult = { label: string; passed: boolean; sticky: boolean; error?: string };

export type RepoSnapshot = {
  path: string;
  label: string;
  snapshot: Snapshot | null;
  error: string | null;
};

export type LessonUpdate = {
  lessonId: string;
  goals: GoalResult[];
  complete: boolean;
  justCompleted: boolean;
  cwd: string | null;
  repos: RepoSnapshot[];
  commands: number;
};

export type GitCheck = { found: boolean; version: string | null; minimum: string; ok: boolean };

export type DirEntry = { name: string; path: string; dir: boolean; size: number };

export type EditorRequest = {
  id: string;
  path: string;
  content: string;
  kind: "rebase-todo" | "commit-message" | "merge-message" | "tag-message" | "other";
};

export const api = {
  gitCheck: () => invoke<GitCheck>("git_check"),
  toolCheck: (tools: string[]) => invoke<Record<string, boolean>>("tool_check", { tools }),
  getCatalog: () => invoke<CatalogView>("get_catalog"),
  getLesson: (id: string) => invoke<LessonView>("get_lesson", { id }),
  startLesson: (id: string, reset: boolean, cols: number, rows: number, onOutput: (data: string) => void) => {
    const output = new Channel<string>();
    output.onmessage = onOutput;
    return invoke<{ lessonId: string; root: string; fresh: boolean }>("start_lesson", { id, reset, cols, rows, output }).then((r) => {
      const w = window as { __canopyPreviewOutput?: string };
      if (w.__canopyPreviewOutput !== undefined) onOutput(w.__canopyPreviewOutput);
      return r;
    });
  },
  stopLesson: () => invoke<void>("stop_lesson"),
  terminalWrite: (data: string) => invoke<void>("terminal_write", { data }),
  terminalResize: (cols: number, rows: number) => invoke<void>("terminal_resize", { cols, rows }),
  submitAnswer: (question: string, value: unknown) => invoke<boolean>("submit_answer", { question, value }),
  runAction: (action: string) => invoke<string>("run_action", { action }),
  listDir: (path: string) => invoke<DirEntry[]>("list_dir", { path }),
  readFile: (path: string) => invoke<string>("read_file", { path }),
  writeFile: (path: string, content: string) => invoke<void>("write_file", { path, content }),
  editorFinish: (id: string, content: string | null) => invoke<void>("editor_finish", { id, content }),
  frontendLog: (level: string, message: string) => invoke<void>("frontend_log", { level, message }).catch(() => {}),
  getSettings: () => invoke<Record<string, string>>("get_settings"),
  setSetting: (key: string, value: string) => invoke<void>("set_setting", { key, value }),
  resetProgress: (section: number | null) => invoke<void>("reset_progress", { section }),
  skipLesson: (id: string) => invoke<void>("skip_lesson", { id }),
  checkUpdates: () => invoke<UpdateCheck>("check_updates"),
  installUpdate: (feed: UpdateFeed) => invoke<boolean>("install_update", { feed }),
};

export const events = {
  onLessonUpdate: (f: (u: LessonUpdate) => void): Promise<UnlistenFn> =>
    listen<LessonUpdate>("lesson-update", (e) => f(e.payload)),
  onEditorRequest: (f: (r: EditorRequest) => void): Promise<UnlistenFn> =>
    listen<EditorRequest>("editor-request", (e) => f(e.payload)),
  onTerminalExit: (f: (lessonId: string) => void): Promise<UnlistenFn> =>
    listen<string>("terminal-exit", (e) => f(e.payload)),
};

export type AreaRow = { path: string; worktree: string | null; index: string | null; head: string | null };

export const inspect = {
  diff: (repo: string, scope: string) => invoke<string>("repo_diff", { repo, scope }),
  threeAreas: (repo: string) => invoke<AreaRow[]>("three_areas", { repo }),
  object: (repo: string, spec: string) => invoke<[string, string]>("git_object", { repo, spec }),
};

export type UpdateFeed = { contentVersion: string; formatVersion: number; url: string; sha256: string; size: number; changelog: string };
export type UpdateCheck = { configured: boolean; installed: string; available: UpdateFeed | null; needsNewerApp: UpdateFeed | null };
export const onUpdateProgress = (f: (p: { done: number; total: number }) => void) =>
  listen<{ done: number; total: number }>("update-progress", (e) => f(e.payload));
