// CodeMirror 6 wrapper. Colors come from CSS variables so both themes work
// without rebuilding the editor.

import { EditorState, RangeSetBuilder, type Extension } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, keymap, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { useEffect, useRef } from "react";

const theme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "var(--color-surface)",
    color: "var(--color-fg)",
    fontSize: "var(--editor-font-size, 13px)",
  },
  ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.45", fontVariantLigatures: "none" },
  ".cm-content": { caretColor: "var(--color-accent)" },
  ".cm-gutters": { backgroundColor: "var(--color-surface)", color: "var(--color-fg-3)", border: "none" },
  ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "color-mix(in oklch, var(--color-sunken) 70%, transparent)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "var(--color-selection) !important" },
  "&.cm-focused": { outline: "none" },
  ".cm-cursor": { borderLeftColor: "var(--color-accent)", borderLeftWidth: "2px" },
  ".conflict-marker": { fontWeight: "700" },
  ".conflict-ours": { backgroundColor: "var(--color-conflict-ours)" },
  ".conflict-theirs": { backgroundColor: "var(--color-conflict-theirs)" },
  ".conflict-base": { backgroundColor: "var(--color-conflict-base)" },
  ".todo-command": {
    backgroundColor: "var(--color-sunken)",
    borderRadius: "3px",
    padding: "0 3px",
    fontWeight: "600",
  },
  ".cm-comment-line": { color: "var(--color-fg-3)" },
});

/** Tints the ours / base / theirs blocks of conflict markers. */
const conflictHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = build(view);
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged) this.decorations = build(u.view);
    }
  },
  { decorations: (v) => v.decorations },
);

function build(view: EditorView): DecorationSet {
  const b = new RangeSetBuilder<Decoration>();
  let block: "ours" | "base" | "theirs" | null = null;
  const doc = view.state.doc;
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const t = line.text;
    if (t.startsWith("<<<<<<<")) {
      block = "ours";
      b.add(line.from, line.from, Decoration.line({ class: "conflict-marker conflict-ours" }));
    } else if (t.startsWith("|||||||") && block) {
      block = "base";
      b.add(line.from, line.from, Decoration.line({ class: "conflict-marker conflict-base" }));
    } else if (t.startsWith("=======") && block) {
      block = "theirs";
      b.add(line.from, line.from, Decoration.line({ class: "conflict-marker conflict-theirs" }));
    } else if (t.startsWith(">>>>>>>") && block) {
      b.add(line.from, line.from, Decoration.line({ class: "conflict-marker conflict-theirs" }));
      block = null;
    } else if (block) {
      b.add(line.from, line.from, Decoration.line({ class: `conflict-${block}` }));
    }
  }
  return b.finish();
}

/** Styles `pick`, `squash`... in rebase todo lists and dims comment lines. */
const todoHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildTodo(view);
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged) this.decorations = buildTodo(u.view);
    }
  },
  { decorations: (v) => v.decorations },
);

function buildTodo(view: EditorView): DecorationSet {
  const b = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    if (line.text.startsWith("#")) {
      b.add(line.from, line.from, Decoration.line({ class: "cm-comment-line" }));
      continue;
    }
    const m = /^(pick|p|reword|r|edit|e|squash|s|fixup|f|exec|x|drop|d|break|b|label|l|reset|t|merge|m|update-ref|u)\b/.exec(line.text);
    if (m) b.add(line.from, line.from + m[1].length, Decoration.mark({ class: "todo-command" }));
  }
  return b.finish();
}

export function CodeEditor({
  value,
  onChange,
  readOnly,
  mode = "plain",
  onSave,
  autoFocus,
}: {
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  mode?: "plain" | "todo";
  onSave?: () => void;
  autoFocus?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  onChangeRef.current = onChange;
  onSaveRef.current = onSave;

  useEffect(() => {
    const extensions: Extension[] = [
      basicSetup,
      theme,
      EditorView.lineWrapping,
      mode === "todo" ? todoHighlighter : conflictHighlighter,
      keymap.of([
        {
          key: "Mod-s",
          run: () => {
            onSaveRef.current?.();
            return true;
          },
        },
        {
          key: "Mod-Enter",
          run: () => {
            onSaveRef.current?.();
            return true;
          },
        },
      ]),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) onChangeRef.current?.(u.state.doc.toString());
      }),
      EditorState.readOnly.of(Boolean(readOnly)),
      EditorView.editable.of(!readOnly),
    ];
    const v = new EditorView({ state: EditorState.create({ doc: value, extensions }), parent: host.current! });
    view.current = v;
    if (autoFocus) v.focus();
    return () => {
      v.destroy();
      view.current = null;
    };
    // Recreated when the document identity changes (parent passes a key).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, mode]);

  // External value change (file changed on disk) without losing the view.
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
    }
  }, [value]);

  return <div ref={host} className="h-full min-h-0 overflow-hidden selectable" />;
}
