// Sheet over the graph pane for GIT_EDITOR / GIT_SEQUENCE_EDITOR requests
// (DESIGN.md 4.7). git waits until the learner saves or aborts.

import { useCallback, useState } from "react";
import { api, type EditorRequest } from "../api";
import { lessonActions, useAppDispatch } from "../store";
import { CodeEditor } from "./CodeEditor";
import { Button, Dialog } from "./ui";

const TITLES: Record<EditorRequest["kind"], string> = {
  "commit-message": "Commit message",
  "rebase-todo": "Rebase todo",
  "merge-message": "Merge message",
  "tag-message": "Tag message",
  other: "Edit file",
};

export function EditorSheet({ request, onDone }: { request: EditorRequest; onDone: () => void }) {
  const dispatch = useAppDispatch();
  const [text, setText] = useState(request.content);
  const [confirmAbort, setConfirmAbort] = useState(false);

  const finish = useCallback(
    async (content: string | null) => {
      await api.editorFinish(request.id, content);
      dispatch(lessonActions.editorRequested(null));
      onDone();
    },
    [request.id, dispatch, onDone],
  );

  return (
    <div
      className="editor-sheet absolute inset-0 z-20 flex flex-col border-b border-edge-2 bg-raised"
      role="dialog"
      aria-label={TITLES[request.kind]}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          setConfirmAbort(true);
        }
      }}
    >
      <div className="flex h-[var(--size-pane-header)] shrink-0 items-center gap-3 border-b border-edge px-3">
        <h2 className="text-2xs font-semibold tracking-[0.06em] text-fg-3 uppercase">{TITLES[request.kind]}</h2>
        <span className="text-xs text-fg-3">git is waiting for this file</span>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConfirmAbort(true)}>
            Abort
          </Button>
          <Button variant="primary" size="sm" onClick={() => finish(text)} title="Ctrl+Enter">
            Save and continue
          </Button>
        </div>
      </div>
      {request.kind === "rebase-todo" && (
        <div className="shrink-0 border-b border-edge px-3 py-1.5 text-xs text-fg-2">
          Change the word at the start of a line to change what happens to that commit: <b>pick</b> keep, <b>reword</b> change message, <b>edit</b> stop to amend,{" "}
          <b>squash</b>/<b>fixup</b> fold into the one above, <b>drop</b> remove. Reorder lines to reorder commits.
        </div>
      )}
      <div className="min-h-0 flex-1">
        <CodeEditor value={text} onChange={setText} onSave={() => finish(text)} mode={request.kind === "rebase-todo" ? "todo" : "plain"} autoFocus />
      </div>
      {confirmAbort && (
        <Dialog
          title="Abort this edit?"
          onClose={() => setConfirmAbort(false)}
          actions={
            <>
              <Button variant="ghost" data-autofocus onClick={() => setConfirmAbort(false)}>
                Keep editing
              </Button>
              <Button variant="danger" onClick={() => finish(null)}>
                Abort
              </Button>
            </>
          }
        >
          git will cancel the operation it was waiting on.
        </Dialog>
      )}
    </div>
  );
}
