import { configureStore, createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { api, type CatalogView, type EditorRequest, type GitCheck, type LessonUpdate, type LessonView } from "../api";

// ---------------------------------------------------------------- app / navigation

export type Screen =
  | { kind: "loading" }
  | { kind: "gate" }
  | { kind: "firstRun" }
  | { kind: "home" }
  | { kind: "section"; section: number }
  | { kind: "lesson"; lesson: string };

export type Toast = { id: number; kind: "info" | "success" | "danger"; text: string; detail?: string };

type AppState = {
  screen: Screen;
  git: GitCheck | null;
  settings: Record<string, string>;
  settingsOpen: boolean;
  shortcutsOpen: boolean;
  /** Navigation waiting for the learner to confirm leaving a lesson. */
  pendingNav: { to: Screen; reasons: string[] } | null;
  toasts: Toast[];
};

let toastId = 0;

const appSlice = createSlice({
  name: "app",
  initialState: { screen: { kind: "loading" }, git: null, settings: {}, settingsOpen: false, shortcutsOpen: false, toasts: [], pendingNav: null } as AppState,
  reducers: {
    navigate(s, a: PayloadAction<Screen>) {
      s.screen = a.payload;
      s.pendingNav = null;
    },
    askToLeave(s, a: PayloadAction<{ to: Screen; reasons: string[] } | null>) {
      s.pendingNav = a.payload;
    },
    setGit(s, a: PayloadAction<GitCheck>) {
      s.git = a.payload;
    },
    setSettings(s, a: PayloadAction<Record<string, string>>) {
      s.settings = a.payload;
    },
    setSettingLocal(s, a: PayloadAction<{ key: string; value: string }>) {
      s.settings[a.payload.key] = a.payload.value;
    },
    openSettings(s, a: PayloadAction<boolean>) {
      s.settingsOpen = a.payload;
    },
    openShortcuts(s, a: PayloadAction<boolean>) {
      s.shortcutsOpen = a.payload;
    },
    pushToast: {
      reducer(s, a: PayloadAction<Toast>) {
        s.toasts = [...s.toasts, a.payload].slice(-3);
      },
      prepare(t: Omit<Toast, "id">) {
        return { payload: { ...t, id: ++toastId } };
      },
    },
    dismissToast(s, a: PayloadAction<number>) {
      s.toasts = s.toasts.filter((t) => t.id !== a.payload);
    },
  },
});

// ---------------------------------------------------------------- catalog / progress

const catalogSlice = createSlice({
  name: "catalog",
  initialState: { data: null as CatalogView | null },
  reducers: {
    setCatalog(s, a: PayloadAction<CatalogView>) {
      s.data = a.payload;
    },
    markComplete(s, a: PayloadAction<string>) {
      if (s.data && !s.data.completed[a.payload]) s.data.completed[a.payload] = Date.now();
    },
  },
});

export const loadCatalog = createAsyncThunk("catalog/load", async (_: void, { dispatch }) => {
  const data = await api.getCatalog();
  dispatch(catalogSlice.actions.setCatalog(data));
  return data;
});

// ---------------------------------------------------------------- current lesson

type LessonState = {
  id: string | null;
  view: LessonView | null;
  update: LessonUpdate | null;
  status: "idle" | "starting" | "running" | "error";
  error: string | null;
  hintsShown: number;
  /** question id -> last feedback */
  feedback: Record<string, "correct" | "wrong">;
  actionRuns: Record<string, number>;
  runningAction: string | null;
  editor: EditorRequest | null;
  /** Repo path the graph is pinned to, or null to follow the terminal. */
  pinnedRepo: string | null;
  noticeDismissed: boolean;
  /** Outside tools this lesson needs that are not installed. */
  missingTools: string[];
  completeCardDismissed: boolean;
  /** Bumped on reset so the terminal clears. */
  generation: number;
  /** Path of a file with unsaved edits in the editor, if any. */
  dirtyFile: string | null;
};

const initialLesson: LessonState = {
  id: null,
  view: null,
  update: null,
  status: "idle",
  error: null,
  hintsShown: 0,
  feedback: {},
  actionRuns: {},
  runningAction: null,
  editor: null,
  pinnedRepo: null,
  noticeDismissed: false,
  missingTools: [],
  completeCardDismissed: false,
  generation: 0,
  dirtyFile: null,
};

const lessonSlice = createSlice({
  name: "lesson",
  initialState: initialLesson,
  reducers: {
    lessonOpening(s, a: PayloadAction<{ id: string; reset: boolean }>) {
      Object.assign(s, initialLesson, { id: a.payload.id, status: "starting", generation: s.generation + 1 });
    },
    lessonLoaded(s, a: PayloadAction<LessonView>) {
      if (a.payload.meta.id !== s.id) return;
      s.view = a.payload;
      for (const [q, ans] of Object.entries(a.payload.answers)) if (ans.correct) s.feedback[q] = "correct";
    },
    lessonStarted(s) {
      s.status = "running";
    },
    lessonFailed(s, a: PayloadAction<string>) {
      s.status = "error";
      s.error = a.payload;
    },
    lessonUpdated(s, a: PayloadAction<LessonUpdate>) {
      if (a.payload.lessonId !== s.id) return;
      s.update = a.payload;
    },
    showHint(s) {
      s.hintsShown += 1;
    },
    answerChecked(s, a: PayloadAction<{ question: string; correct: boolean; value: unknown }>) {
      s.feedback[a.payload.question] = a.payload.correct ? "correct" : "wrong";
      if (s.view) s.view.answers[a.payload.question] = { value: a.payload.value, correct: a.payload.correct };
    },
    answerReopened(s, a: PayloadAction<string>) {
      delete s.feedback[a.payload];
    },
    actionStarted(s, a: PayloadAction<string>) {
      s.runningAction = a.payload;
    },
    actionFinished(s, a: PayloadAction<string>) {
      s.runningAction = null;
      s.actionRuns[a.payload] = (s.actionRuns[a.payload] ?? 0) + 1;
    },
    editorRequested(s, a: PayloadAction<EditorRequest | null>) {
      s.editor = a.payload;
    },
    pinRepo(s, a: PayloadAction<string | null>) {
      s.pinnedRepo = a.payload;
    },
    setMissingTools(s, a: PayloadAction<string[]>) {
      s.missingTools = a.payload;
    },
    setDirtyFile(s, a: PayloadAction<string | null>) {
      s.dirtyFile = a.payload;
    },
    dismissNotice(s) {
      s.noticeDismissed = true;
    },
    dismissCompleteCard(s) {
      s.completeCardDismissed = true;
    },
    lessonClosed() {
      return initialLesson;
    },
  },
});

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
    catalog: catalogSlice.reducer,
    lesson: lessonSlice.reducer,
  },
  middleware: (gdm) => gdm({ serializableCheck: false, immutableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export const appActions = appSlice.actions;
export const catalogActions = catalogSlice.actions;
export const lessonActions = lessonSlice.actions;

// ---------------------------------------------------------------- thunks

export const setSetting = createAsyncThunk("app/setSetting", async (p: { key: string; value: string }, { dispatch }) => {
  dispatch(appActions.setSettingLocal(p));
  await api.setSetting(p.key, p.value);
});

export const submitAnswer = createAsyncThunk(
  "lesson/submitAnswer",
  async (p: { question: string; value: unknown }, { dispatch }) => {
    const correct = await api.submitAnswer(p.question, p.value);
    dispatch(lessonActions.answerChecked({ ...p, correct }));
    return correct;
  },
);

export const runAction = createAsyncThunk("lesson/runAction", async (p: { id: string; label: string }, { dispatch }) => {
  dispatch(lessonActions.actionStarted(p.id));
  try {
    const out = await api.runAction(p.id);
    const last = out.trim().split("\n").filter(Boolean).pop();
    dispatch(appActions.pushToast({ kind: "success", text: last ?? "Event finished." }));
  } catch (e) {
    dispatch(appActions.pushToast({ kind: "danger", text: `"${p.label}" did not finish.`, detail: String(e) }));
  } finally {
    dispatch(lessonActions.actionFinished(p.id));
  }
});

export const resetProgress = createAsyncThunk("catalog/resetProgress", async (section: number | null, { dispatch }) => {
  await api.resetProgress(section);
  await dispatch(loadCatalog());
});

export const skipLesson = createAsyncThunk("catalog/skipLesson", async (id: string, { dispatch }) => {
  await api.skipLesson(id);
  await dispatch(loadCatalog());
});

/**
 * Go to another screen. Leaving a lesson keeps its folder and progress, but
 * unsaved edits, a git command waiting on the editor and a running command
 * are lost, so ask first when any of those apply.
 */
export const go = createAsyncThunk("app/go", async (to: Screen, { dispatch, getState }) => {
  const state = getState() as RootState;
  const from = state.app.screen;
  const leaving = from.kind === "lesson" && !(to.kind === "lesson" && to.lesson === from.lesson);
  if (!leaving) {
    dispatch(appActions.navigate(to));
    return;
  }
  const reasons: string[] = [];
  if (state.lesson.dirtyFile) reasons.push(`Unsaved changes in ${state.lesson.dirtyFile} will be lost.`);
  if (state.lesson.editor) reasons.push("git is waiting for you to finish in the editor; leaving cancels that command.");
  else if (await api.terminalBusy().catch(() => false)) reasons.push("A command is still running in the terminal; leaving stops it.");
  if (reasons.length) dispatch(appActions.askToLeave({ to, reasons }));
  else dispatch(appActions.navigate(to));
});
