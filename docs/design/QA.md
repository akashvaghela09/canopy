# Design QA: implementation vs DESIGN.md

Reviewed: screenshots in `docs/design/qa/` (home light/dark, section, ws-608 light/dark complete state, ws-917 dark, ws-717 light, ws-717 at 1100x700) against `docs/design/DESIGN.md` and `prototype.html`, plus the source in `src/components/*.tsx`, `src/graph/GraphView.tsx`, `src/graph/layout.ts`, `src/styles.css`, `src/components/lesson.css`, `src/graph/graph.css`.

Overall: the implementation is faithful. Tokens, both themes, top bar, home, section view, banners, chips, question widget, repo switcher, remote/tag flag shapes, ghost/lost nodes, copy arrows and the complete moment all match the spec closely. The items below are ordered by impact; each has the exact fix. "P1" blocks a good first impression or hides a core control, "P2" is a visible deviation, "P3" is polish or spec gap to schedule.

---

## P1

### 1. Goals footer scrolls as a whole; Reset lesson and Next disappear
`src/components/LessonPanel.tsx` `GoalsFooter`, line ~276: `<div className="max-h-[40%] shrink-0 overflow-y-auto …">`. With 5–6 goals at 900px height (ws-608, ws-917, ws-717) the action row with **Reset lesson** and **Next** is scrolled out of view and only reachable by scrolling the footer. Spec 4.2: the footer is pinned, only the goal list scrolls inside it, and Reset/Next stay visible.

Fix: make the footer a flex column and scroll only the list.
```tsx
<div className="flex max-h-[40%] shrink-0 flex-col border-t border-edge bg-surface">
  …band / header (shrink-0)…
  <ul aria-label="Goals" className="min-h-0 flex-1 overflow-y-auto px-4 py-1">…</ul>
  …complete card (shrink-0)…
  <div className="flex shrink-0 items-center justify-between px-3 pt-1 pb-3">Reset / Next</div>
</div>
```
Also reduce goal rows from `min-h-8 py-1 text-base` (40px) to `min-h-8 text-base` with `py-0.5` (32px, spec 7.6) so six goals fit in 192px.

### 2. Complete-moment order is inverted
Same component. Current order top to bottom: complete card ("Done. Next: …") → "Lesson complete." band → goals → buttons. Spec 4.2 / prototype: band (replaces the GOALS header) → goals → card → buttons. The card is the call to action and belongs next to the Next button, not above the band.

Fix: move the `complete-card` block to directly after the `<ul>` and before the action row. Put the primary button on the right: `Stay here` (ghost) then `Next lesson` (primary), matching dialogs and the prototype.

### 3. Lesson pane cannot receive keyboard focus (`Alt+1`, `F6`)
`src/components/Workspace.tsx` line 119: `<section role="region" aria-label="Lesson" data-pane="lesson" …>` has no `tabIndex`. `App.tsx` `focusPane` calls `el.focus()`, which is a no-op on a non-focusable section, so `Alt+1` and the F6 cycle skip the lesson panel. Graph and Inspector have `tabIndex={-1}`.

Fix: add `tabIndex={-1}` to the lesson section (and `className="… outline-none"`), or have `focusPane("lesson")` focus `#lesson-title`. Same check for the terminal section when `paneFocus.terminal` is unset (lesson still loading): add `tabIndex={-1}` there too.

### 4. Terminal (and lesson code blocks) render in a fallback monospace
In every workspace screenshot the terminal glyphs (`$`, `g`, `(`) and the `<<<<<<< HEAD` code block are DejaVu Sans Mono, not JetBrains Mono, while the graph ids/flags are JetBrains Mono. Two separate causes are likely:
- xterm measures the font once in `t.open(el)`; `@fontsource-variable/jetbrains-mono` is loaded via CSS and is usually not ready on first paint, so xterm locks in the fallback metrics and never re-measures.
- The browser-preview harness may not serve the fontsource files; verify in the Tauri build before changing CSS.

Fix in `src/components/Terminal.tsx`: wait for the font before opening, and re-apply on `fonts.ready`:
```ts
await document.fonts.load('13px "JetBrains Mono Variable"');   // before t.open(el) / fit.fit()
document.fonts.ready.then(() => { t.options.fontFamily = t.options.fontFamily; fit.fit(); });
```
(Setting `options.fontFamily` to the same string forces xterm's char-measure to rerun.) Also set `fontWeight: "400"`, `fontWeightBold: "600"` so bold output uses the bundled 600 weight, not synthetic bold. For the lesson `pre`, no code change should be needed once the font is present; confirm.

---

## P2

### 5. Section list: completed glyph is outlined, spec is filled
`src/components/screens.tsx` `LessonRow`: `<CheckCircle2 size={16} className="text-success" />` draws a green outline circle with a green check on white. Spec 7.4 and the goals list use a filled success disc with an inverse check. Inconsistent between the two places.

Fix: `<CheckCircle2 size={16} className="fill-success text-surface" aria-label="Complete" />` (same classes as in `GoalsFooter`), and 18px to match the goal glyph.

### 6. Flags stack downward into the commit id (ws-717: `origin/main` overlaps `a17d63d`)
`src/graph/GraphView.tsx` `Flags`: `top = y0 - FLAG_H/2`, flag *i* at `y = i*(FLAG_H+2)`, so the second flag (remote) sits at y+11…y+29 and collides with the id text at y+14…y+21 (ids are centered on the node and extend 23px right, flags start 14px right).

Fix: stack upward so the bottom flag stays level with the node and the stack grows into the lane gap (LANE is 56, so two extra flags fit):
```ts
const n = flags.length;
const top = y0 - FLAG_H / 2 - (n - 1) * (FLAG_H + 2);   // group top
// flag i (0 = local branch, then remotes, then tags) at y = (n - 1 - i) * (FLAG_H + 2)
```
Place the HEAD text at `y = -4` above the whole stack when the node is HEAD (top of group), with `textAnchor="start"`; drop the `currentIdx` arithmetic. Keep the connector stub at the bottom flag's mid-height (`y = (n-1)*(FLAG_H+2) + FLAG_H/2`).
Also move the id label left/down when a merge node's double ring and a flag stub compete: not needed after the above.

### 7. Changes tab scope selector wraps onto two lines at 320px
`src/components/Inspector.tsx` `ChangesTab`: three pill buttons with the full labels ("Working tree vs staging", "Staging vs HEAD", "Working tree vs HEAD") wrap at the default inspector width (ws-608). Spec 4.6: one scope selector.

Fix: a native `<select>` (h-7, `border-edge-2`, `bg-surface`, text-xs) with the three labels, left-aligned in a 36px row, plus the file list when more than one file. Or keep segments with short labels `Unstaged · Staged · All` and the long label as `title`. Prefer the select: it also reads correctly to screen readers as "Scope".

### 8. `Teaches …` line prints raw skill ids as words
`src/store/progress.ts` `humanizeSkill` only strips `concept-` and replaces dashes: ws-608 shows "Teaches conflict read", ws-917 "Teaches rebase i reorder drop". This reads as broken English.

Fix (no content change needed): render skill ids as mono chips instead of prose: `Teaches` + `<Chip tone="outline" className="font-mono normal-case">conflict-read</Chip>`. If prose is wanted later, add an optional `teachesLabel` to `lesson.yaml` via LESSON_FORMAT.

### 9. Small-window defaults not applied (ws-717-small)
`src/components/Workspace.tsx`: `panes.lessonW` is used as stored (360) at 1100px; spec 4.1: below 1280px content width the lesson default is 300 and inspector 260, so the center keeps ≥ 540. The terminal hint also wraps to two lines.

Fix: clamp at render time, not only in the drag handler:
```ts
const narrow = window.innerWidth < 1280;   // via a useWindowWidth hook / ResizeObserver on the root
const lessonW = Math.min(panes.lessonW, narrow ? 300 : 480);
const inspectorW = Math.min(panes.inspectorW, narrow ? 260 : 560);
```
and give the hint text `className="min-w-0 flex-1 truncate"` (wrap the text in a `<span>`).

### 10. Lesson code blocks overflow horizontally
ws-608: the `<<<<<<<` block is cut at "the line as it is on the branch you are m" with a horizontal scrollbar. Learners read these; horizontal scrolling in a 360px column hides the point.

Fix in `src/components/lesson.css`: `.lesson-md pre { white-space: pre-wrap; overflow-wrap: anywhere; }` (drop `overflow-x: auto`). Terminal output quoted in lessons is short; wrapping is the better failure mode.

### 11. Operation chip lacks the conflict state
`src/components/GraphPane.tsx`: chip reads "Merge in progress" during a conflict. Spec 4.4 / prototype: "Merge in progress · conflict" when `workingTree.conflicted.length > 0`; for rebase, "Rebase in progress · 2 of 4" when the step is known.

Fix: `{operationLabel(op)} in progress{snap.workingTree.conflicted.length ? " · conflict" : ""}`; add a `pause` glyph (lucide `Pause`) instead of `GitMerge` when `op === "rebase"`.

### 12. Terminal pane header is missing its controls
Spec 4.5: `Clear`, font size −/+ and the keyboard-hint icon live in the terminal header. Only the destructive chip is there. Clear is used constantly in lessons.

Fix: in `Workspace.tsx` terminal `PaneHeader` children: `<Button variant="ghost" size="sm" onClick={() => term.clear()}>Clear</Button>` (expose `clear` next to `registerFocus` in `Terminal.tsx`), two `IconButton`s (`Minus`/`Plus`, 24px) bound to the `terminalFontSize` setting (clamp 11–18), and an `IconButton icon={Keyboard}` whose `title` is "Alt+1–4 or F6 moves focus out of the terminal".

### 13. Dialog has no focus trap
`src/components/ui.tsx` `Dialog`: initial focus and Escape work, but Tab leaves the dialog and reaches the workspace behind the scrim. Spec 10.2.

Fix: on `Tab`/`Shift+Tab` keydown inside the dialog, cycle among `ref.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')`. Same for `SettingsSheet` in `App.tsx`.

---

## P3

### 14. Graph pane: no view menu, no "Graph as text"
Spec 4.4 and 10.3: a `⋯` view menu (Fit, Show reflog trail, Show commit ids, Collapse old history, Side by side) and a "Graph as text" alternative for screen readers. Side by side exists as a standalone icon (fine); commit ids are a global setting. Add the menu with "Graph as text" (opens a dialog listing `short id · subject · parents · labels`, selectable), and the reflog trail toggle when the layout supports it. Keep the side-by-side icon as a shortcut in the menu.

### 15. Graph keyboard navigation
Spec 8: the graph region is focusable, `←/→` move selection along first-parent, `↑/↓` across lanes, `Enter` opens details, `Esc` clears. Currently nodes are click-only. Implement on the `<section data-pane="graph">` `onKeyDown`, tracking `selected` in `GraphPane`; show the selected commit in the Changes tab ("Commit abc1234") as specified.

### 16. Graph geometry sits top-left with an empty canvas below
`PAD_TOP = 48`, graph height is content-sized; at 1440x900 the SVG occupies the upper third of the pane. Center it vertically when it is shorter than the pane: scroller `className="flex h-full w-full items-center overflow-auto"` (keep `items-start` when `g.height > clientHeight`). Horizontal auto-pan already handles width.

### 17. Copy arrows never expire and cross id labels (ws-917)
Spec 8: the dotted original→copy arrow is shown for two commands' worth of snapshots, then fades; here it persists (`layout.ts` emits a `copy` edge whenever a ghost has a copy) and the arrow from `359ce81` runs through the `1c82d08` label. Add a per-copy "born at update N" map in `GraphPane` (or a `copyAge` in the store keyed by ghost id) and drop `copy` edges older than 2 updates; while shown, route the arrow as a quadratic curve arcing above the lane (`Q` control point at `(mid, min(y1,y2) - 24)`) so it clears id labels. Crossing arrows after a reorder are correct and should stay.

### 18. Question widget details
`LessonPanel.tsx` `QuestionCard`: `Check answer` is `size="sm"` (24px); spec 7.7 uses the default 28px secondary. Commit input width `w-40` matches; add `data-commit-question` on the input for the graph-click insert (already wired in `GraphPane.onSelect`; confirm the attribute exists after the latest edit). Hints heading: use the caps `block-h` style (`text-2xs font-semibold tracking uppercase text-fg-3`) like the Events block, not `text-sm font-medium`.

### 19. Home continue card: no lesson blurb
Spec 3.3 shows a one-line description under the next lesson. `lesson.yaml` has no summary field, so derive it: first sentence of `content.md` (up to the first period, max 120 chars) exposed on `LessonSummary` as `blurb`. Optional; if skipped, remove the empty row so the card stays 3 lines.

### 20. Repo switcher keyboard behavior
`GraphPane.tsx`: `role="radiogroup"` with `role="radio"` buttons but no arrow-key handling; spec 7.12: arrows move, Space selects. Add `onKeyDown` on the group: `ArrowLeft/Right` → focus and select the neighbour; set `tabIndex={on ? 0 : -1}` on segments (roving tabindex).

### 21. Spec amendments (accepted deviations, DESIGN.md will be updated)
- Graph grid: `COL = 58` / `LANE = 56` instead of 44 / 28, to fit 7-char ids under nodes and stacked flags. Accepted. With the upward flag stacking in item 6, LANE can come down to 48 if the graph feels sparse; keep 56 for now.
- Terminal cwd shown as the path relative to the lesson root (`work`, `.`) rather than `repo · cwd`. Accepted; show `outside the learning folder` as implemented.
- Unowned-but-reachable commits (branch deleted after merge, ws-717 `530b912`) draw in the main neutral color. Accepted; add this sentence to DESIGN.md 8.

---

## Verified as matching the spec (no action)
Tokens and both themes (`styles.css` is byte-for-byte the spec, dark duplicated under both selectors as allowed); top bar with breadcrumbs, prev/next ids, count chip; home grid, current-card accent border + dot, "Continue · 7 of 17", success bar at 100%; section header, Next tag, kind/flag chips, danger-ghost Reset progress; lesson header (id · kind, title, teaches line), destructive banner and recommended-first notice order and copy; Events block with View script and "Ran N×"; question states (correct border, "Not quite. Try again." in fg-2, no red); hint reveal copy; HEAD ring + label, main neutral flag, branch flag fill, dashed remote flag with light `origin/` prefix, tag polygon, merge double circle, ghost dashed hollow at 55%, lost solid gray, copy arrow styling, revert link; stash strip; detached-HEAD banner; first-focus terminal hint and dismissal; editor sheet title/legend/Ctrl+Enter/abort dialog; content-update state machine and copy (plus a sensible extra `notConfigured` state); reduced-motion variables; `transform`/`opacity`-only graph motion.
