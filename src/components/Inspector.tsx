// Right pane: Files (tree + editor), Changes (diff), Areas (three-area
// panel) and .git (DESIGN.md 4.6).

import { ChevronDown, ChevronRight, File, Folder, FolderGit2, PanelRightClose, RefreshCw, Terminal as TerminalIcon, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, inspect, type AreaRow, type DirEntry } from "../api";
import type { Snapshot } from "../graph/types";
import { editorSaver, lessonActions, useAppDispatch, useAppSelector } from "../store";
import { CodeEditor } from "./CodeEditor";
import { useActiveRepo } from "./GraphPane";
import { Button, IconButton, Spinner } from "./ui";

export type InspectorTab = "files" | "inside-git";

const TAB_LABEL: Record<InspectorTab, string> = { files: "Files", "inside-git": "Inside .git" };

export type OpenFile = { path: string; readOnly?: boolean; content?: string; title?: string };

export function Inspector({
  tabs,
  tab,
  onTab,
  openFile,
  onOpenFile,
  onCollapse,
}: {
  tabs: InspectorTab[];
  tab: InspectorTab;
  onTab: (t: InspectorTab) => void;
  openFile: OpenFile | null;
  onOpenFile: (f: OpenFile | null) => void;
  onCollapse: () => void;
}) {
  // Bumps on every lesson update so panels re-read files.
  const tick = useAppSelector((s) => s.lesson.update);
  return (
    <section role="region" aria-label="Inspector" className="flex h-full min-h-0 flex-col bg-surface" data-pane="inspector" tabIndex={-1}>
      <div className="flex h-[var(--size-pane-header)] shrink-0 items-end gap-4 border-b border-edge px-3" role="tablist">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => onTab(t)}
            className={`-mb-px h-8 border-b-2 text-sm font-medium transition-colors ${tab === t ? "border-fg text-fg" : "border-transparent text-fg-2 hover:text-fg"}`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
        <div className="mb-1.5 ml-auto">
          <IconButton icon={PanelRightClose} label="Close (Alt+4)" onClick={onCollapse} />
        </div>
      </div>
      <div className="min-h-0 flex-1">
        {tab === "files" && <FilesTab openFile={openFile} onOpenFile={onOpenFile} tick={tick} />}
        {tab === "inside-git" && <GitTab />}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Files

function statusGlyphs(snap: Snapshot | null | undefined, repoPath: string | undefined) {
  const m = new Map<string, { glyph: string; cls: string }>();
  if (!snap || repoPath === undefined) return m;
  const prefix = repoPath === "." ? "" : `${repoPath}/`;
  const set = (p: string, glyph: string, cls: string) => m.set(prefix + p, { glyph, cls });
  snap.workingTree.untracked.forEach((p) => set(p, "?", "text-fg-3"));
  snap.workingTree.staged.forEach((p) => set(p, "A", "text-success"));
  snap.workingTree.modified.forEach((p) => set(p, "M", "text-warning"));
  snap.workingTree.conflicted.forEach((p) => set(p, "!", "text-danger font-bold"));
  return m;
}

function FilesTab({ openFile, onOpenFile, tick }: { openFile: OpenFile | null; onOpenFile: (f: OpenFile | null) => void; tick: unknown }) {
  const { active } = useActiveRepo();
  const glyphs = useMemo(() => statusGlyphs(active?.snapshot, active?.path), [active]);
  // The tree follows the terminal: expand to and highlight its folder.
  const cwd = useAppSelector((s) => s.lesson.update?.cwd ?? null);
  // Section 1 teaches hidden files with `ls -a`; don't show them in the tree there.
  const hideDot = useAppSelector((s) => s.lesson.view?.meta.section === 1);
  const treeProps = { tick, glyphs, cwd, hideDot };
  if (openFile) {
    return (
      <div className="flex h-full flex-col">
        <div className="max-h-40 shrink-0 overflow-y-auto border-b border-edge">
          <Tree path="" depth={0} {...treeProps} selected={openFile.path} onOpen={(p) => onOpenFile({ path: p })} />
        </div>
        <FileEditor file={openFile} tick={tick} onClose={() => onOpenFile(null)} />
      </div>
    );
  }
  return (
    <div className="h-full overflow-y-auto py-1">
      <Tree path="" depth={0} {...treeProps} onOpen={(p) => onOpenFile({ path: p })} />
    </div>
  );
}

const GLYPH_MEANING: Record<string, string> = {
  "?": "Untracked: git is not tracking this file yet",
  A: "Staged: ready for the next commit",
  M: "Modified since the last commit",
  "!": "Conflict: needs resolving",
};

function Tree({
  path,
  depth,
  tick,
  glyphs,
  cwd,
  hideDot,
  selected,
  onOpen,
}: {
  path: string;
  depth: number;
  tick: unknown;
  glyphs: Map<string, { glyph: string; cls: string }>;
  cwd: string | null;
  hideDot: boolean;
  selected?: string;
  onOpen: (path: string) => void;
}) {
  const [entries, setEntries] = useState<DirEntry[] | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!cwd || !entries) return;
    const ancestor = entries.find((e) => e.dir && (cwd === e.path || cwd.startsWith(`${e.path}/`)));
    if (ancestor && !open[ancestor.path]) setOpen((o) => ({ ...o, [ancestor.path]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cwd, entries]);
  useEffect(() => {
    let live = true;
    api
      .listDir(path)
      .then((e) => live && setEntries(e))
      .catch(() => live && setEntries([]));
    return () => {
      live = false;
    };
  }, [path, tick]);
  if (!entries) return null;
  if (depth === 0 && entries.length === 0) return <div className="px-3 py-2 text-sm text-fg-3">This folder is empty.</div>;
  return (
    <ul role={depth === 0 ? "tree" : "group"}>
      {entries
        .filter((e) => !hideDot || !e.name.startsWith(".") || e.name === ".git")
        .map((e) => {
        const isGit = e.name === ".git";
        const here = e.dir && cwd === e.path;
        const g = glyphs.get(e.path);
        const expanded = open[e.path];
        return (
          <li key={e.path} role="treeitem" aria-expanded={e.dir ? Boolean(expanded) : undefined}>
            <button
              title={here ? "The terminal is in this folder" : undefined}
              className={`flex h-6 w-full items-center gap-1.5 pr-3 text-left text-sm hover:bg-sunken ${selected === e.path || here ? "bg-selection" : ""} ${
                g?.glyph === "!" ? "bg-danger-soft" : ""
              } ${isGit ? "text-fg-3" : ""}`}
              style={{ paddingLeft: 8 + depth * 12 }}
              onClick={() => (e.dir ? setOpen((o) => ({ ...o, [e.path]: !o[e.path] })) : onOpen(e.path))}
            >
              {e.dir ? expanded ? <ChevronDown size={14} className="text-fg-3" /> : <ChevronRight size={14} className="text-fg-3" /> : <span className="w-3.5" />}
              {isGit ? <FolderGit2 size={14} /> : e.dir ? <Folder size={14} className="text-fg-2" /> : <File size={14} className="text-fg-2" />}
              <span className="truncate">{e.name}</span>
              {here && <TerminalIcon size={12} className="text-fg-3" aria-label="terminal is here" />}
              {g && (
                <span className={`ml-auto font-mono text-xs ${g.cls}`} title={GLYPH_MEANING[g.glyph]}>
                  {g.glyph}
                </span>
              )}
            </button>
            {e.dir && expanded && <Tree path={e.path} depth={depth + 1} tick={tick} glyphs={glyphs} cwd={cwd} hideDot={hideDot} selected={selected} onOpen={onOpen} />}
          </li>
        );
      })}
    </ul>
  );
}

function FileEditor({ file, tick, onClose }: { file: OpenFile; tick: unknown; onClose: () => void }) {
  const [text, setText] = useState<string | null>(file.content ?? null);
  const [saved, setSaved] = useState<string | null>(file.content ?? null);
  const [error, setError] = useState<string | null>(null);
  const dirty = text !== null && text !== saved;
  const dispatch = useAppDispatch();
  // Tell the store, so leaving the lesson can warn about unsaved edits.
  useEffect(() => {
    dispatch(lessonActions.setDirtyFile(dirty && !file.readOnly ? file.path : null));
    return () => {
      dispatch(lessonActions.setDirtyFile(null));
    };
  }, [dirty, file.path, file.readOnly, dispatch]);

  // Reload from disk when the file changes outside the editor (and we have no edits).
  useEffect(() => {
    if (file.content !== undefined) return;
    api
      .readFile(file.path)
      .then((t) => {
        setSaved(t);
        setText((cur) => (cur === null || cur === saved ? t : cur));
        setError(null);
      })
      .catch((e) => setError(String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.path, tick]);

  const save = useCallback(async () => {
    if (text === null || file.readOnly) return;
    await api.writeFile(file.path, text);
    setSaved(text);
  }, [file, text]);
  // Let the leave dialog's "Save and leave" save this file.
  useEffect(() => {
    editorSaver.save = dirty ? save : null;
    return () => {
      editorSaver.save = null;
    };
  }, [dirty, save]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-8 shrink-0 items-center gap-2 border-b border-edge px-3">
        <span className="truncate font-mono text-xs text-fg-2">{file.title ?? file.path}</span>
        {file.readOnly && <span className="text-2xs text-fg-3">read-only</span>}
        {dirty && <span className="text-2xs text-fg-3">unsaved</span>}
        <div className="ml-auto flex items-center gap-1">
          {!file.readOnly && (
            <Button size="sm" variant={dirty ? "primary" : "ghost"} disabled={!dirty} onClick={save} title="Save (Ctrl+S)">
              Save
            </Button>
          )}
          <IconButton icon={X} label="Close file" onClick={onClose} />
        </div>
      </div>
      {error ? (
        <div className="p-3 text-sm text-fg-2">{error}</div>
      ) : text === null ? (
        <div className="p-3">
          <Spinner />
        </div>
      ) : (
        <CodeEditor key={file.path} value={text} readOnly={file.readOnly} onChange={setText} onSave={save} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Areas strip

/**
 * The three areas, left to right, as a strip between graph and terminal in
 * the lessons that teach them (REVIEW_2.md items 8–9).
 */
export function AreasStrip({ onOpenFile }: { onOpenFile: (f: OpenFile) => void }) {
  const tick = useAppSelector((s) => s.lesson.update);
  const { active } = useActiveRepo();
  const [rows, setRows] = useState<AreaRow[] | null>(null);
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (!active || active.snapshot?.bare || !active.snapshot) return setRows([]);
    inspect.threeAreas(active.path).then(setRows, () => setRows([]));
  }, [active, tick]);
  const cols = [
    { key: "worktree" as const, title: "Working tree", sub: "files on disk", empty: "Nothing here yet" },
    { key: "index" as const, title: "Staging", sub: "what the next commit will contain", empty: "Nothing staged" },
    { key: "head" as const, title: "Last commit (HEAD)", sub: "", empty: "No commits yet" },
  ];
  return (
    <section aria-label="Where your changes are" className="shrink-0 border-t border-edge bg-surface">
      <button className="flex h-8 w-full items-center gap-1.5 px-3 text-left text-xs text-fg-2 hover:text-fg" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>
          Where your changes are: <b className="font-medium text-fg">Working tree</b> (files on disk) → <b className="font-medium text-fg">Staging</b> (the next commit) →{" "}
          <b className="font-medium text-fg">Last commit (HEAD)</b>
        </span>
      </button>
      {open && (
        <div className="grid max-h-[132px] grid-cols-3 gap-3 overflow-y-auto px-3 pb-2">
          {cols.map((c, i) => {
            const files = (rows ?? []).filter((r) => r[c.key] !== null);
            return (
              <div key={c.key} className="min-w-0">
                {files.length === 0 ? (
                  <div className="rounded-md border border-dashed border-edge p-2 text-xs text-fg-3">{c.empty}</div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {files.map((r) => {
                      const v = r[c.key]!;
                      const prev = i === 0 ? undefined : r[cols[i - 1].key];
                      const differs = i > 0 && v !== prev;
                      return (
                        <button
                          key={r.path}
                          onClick={() => onOpenFile({ path: `${active!.path}/${r.path}`, readOnly: true, content: v, title: `${r.path} · ${c.title}` })}
                          aria-label={`${r.path}, ${c.title} version${differs ? ", differs from the column to its left" : ""}`}
                          className="min-w-0 rounded-md border border-edge-2 p-1.5 text-left hover:bg-sunken"
                        >
                          <div className="flex items-center gap-1">
                            <span className="truncate font-mono text-xs font-semibold">{r.path}</span>
                            {differs && <span className="ml-auto shrink-0 rounded-sm bg-warning-soft px-1 text-2xs text-fg-2">differs</span>}
                          </div>
                          <pre className="mt-0.5 overflow-hidden font-mono text-2xs leading-4 whitespace-pre text-fg-2">{v.split("\n").slice(0, 2).join("\n") || "(empty)"}</pre>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- .git

function GitTab() {
  const { active } = useActiveRepo();
  const snap = active?.snapshot;
  const [spec, setSpec] = useState("");
  const [obj, setObj] = useState<{ type: string; body: string } | { error: string } | null>(null);
  const look = async () => {
    if (!active || !spec.trim()) return;
    try {
      const [type, body] = await inspect.object(active.path, spec.trim());
      setObj({ type, body });
    } catch (e) {
      setObj({ error: String(e) });
    }
  };
  if (!snap) return <div className="p-4 text-sm text-fg-3">No repository here yet.</div>;
  return (
    <div className="h-full overflow-auto p-3 text-sm">
      <details open>
        <summary className="cursor-pointer text-2xs font-semibold tracking-[0.06em] text-fg-3 uppercase">Refs</summary>
        <table className="mt-1 w-full font-mono text-xs">
          <tbody>
            <tr>
              <td className="py-0.5 pr-2">HEAD</td>
              <td className="text-fg-2">{snap.head.detached ? snap.head.commit?.slice(0, 7) : `ref: refs/heads/${snap.head.branch ?? "main"}`}</td>
            </tr>
            {snap.refs.map((r) => (
              <tr key={`${r.kind}${r.name}`}>
                <td className="py-0.5 pr-2">{r.kind === "branch" ? `refs/heads/${r.name}` : r.kind === "tag" ? `refs/tags/${r.name}` : `refs/remotes/${r.name}`}</td>
                <td className="text-fg-2">{r.target.slice(0, 7)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <details open className="mt-3">
        <summary className="cursor-pointer text-2xs font-semibold tracking-[0.06em] text-fg-3 uppercase">Index</summary>
        {snap.index.length === 0 ? (
          <div className="mt-1 text-xs text-fg-3">The index is empty.</div>
        ) : (
          <table className="mt-1 w-full font-mono text-xs">
            <tbody>
              {snap.index.map((e) => (
                <tr key={`${e.path}:${e.stage}`}>
                  <td className="py-0.5 pr-2">{e.path}</td>
                  <td className="pr-2 text-fg-3">{e.stage}</td>
                  <td className="text-fg-2">{e.blob.slice(0, 7)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </details>
      <details open className="mt-3">
        <summary className="cursor-pointer text-2xs font-semibold tracking-[0.06em] text-fg-3 uppercase">Objects</summary>
        <div className="mt-2 flex gap-2">
          <input
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && look()}
            placeholder="hash or name, e.g. HEAD^{tree}"
            className="h-7 min-w-0 flex-1 rounded-sm border border-edge-2 bg-surface px-2 font-mono text-xs focus:border-accent focus:outline-none"
            aria-label="Object to show"
          />
          <Button size="sm" onClick={look} icon={RefreshCw}>
            Show
          </Button>
        </div>
        {obj && "error" in obj && <div className="mt-2 text-xs text-fg-2">{obj.error.replace(/^Error: /, "")}</div>}
        {obj && "type" in obj && (
          <div className="mt-2">
            <div className="text-xs text-fg-3">type: {obj.type}</div>
            <pre className="selectable mt-1 overflow-auto rounded-md bg-sunken p-2 font-mono text-xs whitespace-pre">{obj.body}</pre>
          </div>
        )}
      </details>
    </div>
  );
}
