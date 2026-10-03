# Design review 2: the workspace after the UX round

Reviewed v0.2.0 as design lead against the owner's two 1920x1080 screenshots (7.04, 6.06), twelve fresh preview captures (first run, home fresh and with progress, section 6, settings, lessons 1.01 / 2.03 / 5.13 / 6.08 / 7.17 / 9.16 at 1366x768, 1440x900 and 1920x1080, light and dark), and the current source (`Workspace.tsx`, `LessonPanel.tsx`, `GraphView.tsx`, `GraphPane.tsx`, `Inspector.tsx`, `App.tsx`, `ui.tsx`, `EditorSheet.tsx`, `theme.ts`). `UX_REVIEW.md` and `UX_DECISIONS.md` were read first; nothing below re-opens a ruling there except where I say so explicitly.

Panel usage across the 225 lessons (from `lesson.yaml`): `three-areas` 28 lessons (1.05–2.14, 4.x, 5.07, 8.x, 9.03/9.19/9.20), `inside-git` 20 (1.03, 5.12, all of 14), `diff` 4 (2.07, 2.08, 6.08, 6.09). Twelve lessons mention "the files panel" in their text.

---

## 1. Honest critique

**The screen is laid out like a developer tool, and the lesson is the thing that gets squeezed.** On the owner's 1920x1080 screenshots the lesson text has a 345px measure (18% of the width) and the graph has 1500x420px for three commits. At 1440x900 it is 360px against a 760x390 graph for two commits (2.03). Everything the learner must read is in the narrow column; the region that is mostly empty is the widest. This is the root of "both panels feel cramped" and it is a layout-priority mistake in my original spec, not an implementation error: I sized the graph for section 9 and the lesson panel for a sidebar, and the app shows section 1–6 content 90% of the time.

**The lesson panel is a scroll trap.** Header plus "Easier after" (2 lines), the body, then a pinned goals block of up to 35%. At 1440x900 the reading area is about 470px; in every captured lesson the "Try it" steps start at or below the fold, the questions are further down, and the goals (which tell you what will be checked) are pinned at the bottom in a separate list. The learner reads theory, scrolls for steps, scrolls back for the question, and watches the goals tick in a region that steals the space the steps needed. Pinning the full goal list was my call in DESIGN.md 4.2; it is the wrong trade at this panel width.

**Navigation is a breadcrumb and one button.** After the last round removed the top-bar prev/next, the only ways to move are the footer "Next" (bottom-left, below the goals, invisible when the list is long at 768px), a breadcrumb whose links look like labels (fg-2 text, no affordance until hover), the wordmark as "home" (a convention beginners do not know), and keyboard chords nobody discovers. There is no "previous", and no way to see the other lessons of the section without leaving the lesson. "Where am I, what is around me, how do I go back" is answered only by the breadcrumb.

**Leaving a lesson is silent and lossy.** Navigating away stops the shell at once. The folder, progress and answers survive, so most of the time nothing is lost, but an unsaved editor buffer, a pending commit-message editor, or a running command vanishes without a word. Worse, nothing tells learners that leaving is normally safe, so the careful ones are afraid to leave and the careless ones lose edits.

**The branch element is overcrowded.** In 7.04 the floating "HEAD" text sits level with the dashed `origin/main` pill, so it reads as "HEAD → origin/main", which is false. The upward stack puts the remote above the local branch, the connector stub pokes between the ring and the pill, and the subject label under the tip ("Add lake trail") is cut by the ring. Three separate ideas (where HEAD is, which branch is current, what the remote knows) are drawn with four marks in a 40px square.

**The right pane is a mystery box.** Files is always there, usually showing three folders that never change. Changes shows "Nothing has changed" during a conflict (6.08). Areas appears in some lessons with "No files yet" and vanishes in others. The tabs are nouns with no verbs, and nothing in the lesson flow points at them at the moment they matter. The owner's "what is the point?" is the correct reaction: the panel earns its place in about 50 lessons and costs 320px in all 225.

**Smaller things that add up.** The graph key row costs 28px in every repo lesson forever. "Ticks automatically as you work" is shown forever. The terminal hint row stays until someone finds its ✕. "GRAPH cafe" is a header for a pane that has one control. The "Lesson complete 6/6" chip repeats the count the checkmarks already show. Section rows are a list of titles with 60% of the row empty. None of these is wrong on its own; together they are the "dashboard texture" the previous review named, still present.

**What is right and must stay.** The restraint: colour only where it means something, calm copy, kind error states, filled success checks, the ink primary button, the auto-focused terminal, subjects under nodes, the once-only hint, "Easier after" as a quiet line, the single "Next: <title>" on completion. The dark and light themes are both clean. The editor sheet, dialogs and toasts are correct and need only small sizing changes.

---

## 2. Answers to the owner's six points

### 2.1 Text size
Agree with rem tokens and one "Text size" setting that also drives the terminal. Design it like this, not as a pure global zoom:

- Root scale: `html { font-size: calc(16px * var(--text-scale)) }` where `--text-scale` is 0.9 / 1 / 1.12 / 1.25 / 1.4 ("Small" to "Largest"). All `--text-*` tokens become rem (`--text-sm: 0.8125rem`, etc.). Spacing stays px (the 4px grid should not grow, or everything looks inflated); pane widths become `clamp()` of rem and vw (section 3, item 1) so panels widen with text.
- Lesson body gets a larger base than UI chrome: body `0.9375rem/1.6` (15px at Default), UI chrome `0.8125rem` (13px). The learner reads the body for minutes and glances at chrome.
- Terminal: `fontSize = round(13 * scale)`, re-fit on change (already wired). Graph labels: SVG text in rem too (`.g-flag { font-size: 0.6875rem }`) and replace `CHAR_W` with `canvas.measureText` so pill widths follow the font; node spacing `COL` scales with `--text-scale` so subjects keep 15 characters.
- `Ctrl+=` / `Ctrl+-` / `Ctrl+0` change this one setting (not only the terminal), and the Settings select previews live. Keep five steps; drop the note's second sentence to "Ctrl+= and Ctrl+- also work."
- Large sizes at small windows: at 1.25 and above, below 1440px wide, the drawer (item 1) and the graph header controls collapse first; nothing else needs special-casing once widths are in rem.

### 2.2 Navigation
See item 4. Model in one sentence: **the breadcrumb says where you are and is clickable; the lesson crumb opens the list of this section's lessons; the lesson panel's bottom bar has Previous and Next; the wordmark is Home and says so.**

### 2.3 Losing changes
See item 5. Rule: warn only when something is actually lost (unsaved edit, git waiting on the editor, a command still running); otherwise leave instantly; and say "your work is kept" in the two places learners look when they are unsure (the leave dialog and the resumed-lesson notice).

### 2.4 Cramped panels
See items 1–3. Numbers: lesson panel `clamp(22.5rem, 28vw, 32rem)` (360 / 403 / 512px at 1366 / 1440 / 1920), 20px padding, 15px body, inline goals, one-row status bar; right pane closed by default and opened as a drawer; graph pane auto-height.

### 2.5 Branch element
See item 6. One row of pills to the right of the tip, HEAD written into the current branch pill as `HEAD → main` (git's own wording), ring on the node as the non-text signal, remotes dashed, tags shaped, non-tip labels stacked above the node, subjects pushed 4px lower.

### 2.6 Files / Changes / Areas / .git
Verdicts (details in item 8): **Files** keep, on demand. **Changes** remove. **Areas** keep, but move it out of the side pane into a full-width strip under the graph, only in the 28 lessons that declare it, and rename it. **.git** keep as "Inside .git", only in its 20 lessons, inside the Files drawer.

---

## 3. Changes, P1 to P3

Each item: what, why, exact spec. File names are where the change lands today.

### P1

#### 1. Rebalance the workspace: wide lesson panel, drawer instead of inspector
**Why:** The lesson is read for minutes; the right pane is used in a quarter of the lessons. Space should follow use.

**Spec (`Workspace.tsx`):**
- Lesson panel width: `clamp(22.5rem, 28vw, 32rem)`; user drag range 20rem–36rem, stored as rem; double-click the handle resets to the clamp value. Collapsible to the 36px rail as now (`Alt+[`).
- Right pane becomes a **drawer**: closed by default at every width. Width `clamp(20rem, 24vw, 26rem)`. Opens from: a "Files" button in the terminal header (item 10), `Alt+4`, a lesson that declares `panels: [files]` or `[inside-git]` (opens on lesson load), and clicking any file path chip in lesson text (`code` spans that match a path in the repo get a hover underline and open the file). Closing: the `panel-right-close` icon in the drawer header, `Alt+4` again, `Esc` while focus is in the drawer. State per lesson session, not persisted.
- Remove the right **rail** entirely; when the drawer is closed nothing is on the right edge. (The left rail stays, it carries the goal count.)
- Editor mode (file open) widens the drawer to `min(50%, 45rem)` as now.
- Center column minimum 560px. Window below 1100px: lesson panel auto-collapses, drawer stays available.
- Result at 1440x900: lesson 403, center 1037. At 1920x1080: 512 / 1408 (1048 with the drawer open). At 1366x768: 382 / 984.

#### 2. Graph pane: height follows the graph, header only when it has controls, key becomes a popover
**Why:** Two commits do not need 390px. The owner's screenshots are mostly canvas.

**Spec (`Workspace.tsx`, `GraphPane.tsx`, `GraphView.tsx`):**
- Pane height = content height: `header? + PAD_TOP + (lanes-1)*LANE + PAD_BOTTOM + strip?`, clamped to `[136px, 45% of the center column]`. Lanes are the layout's `lanes`; ghost/lost rows count. Height changes animate `height` 240ms once per lane change (this is the one permitted layout animation; it happens a few times per lesson at most). Drag handle still works and sets a manual height that sticks until Reset lesson or lesson change.
- Header: render the 36px header **only** when it has a control: repo switcher (multi-repo lessons), operation chip, or "Compare with origin". Single-repo lessons get no header; the operation chip, when present, floats top-left inside the canvas (12px inset) and the collapse button is removed (collapsing a 136px pane saves nothing; `Alt+2` focus remains).
- Key row: remove. Add a 24px ghost "Key" button bottom-right inside the canvas (12px inset, `circle-help` icon + "Key", fg-3). Click opens a 260px popover (bg raised, 1px edge-2) listing: `● commit`, `◎ HEAD: where you are`, `[pill] branch · dashed = remote copy`, `⬠ tag`, `● grey: on no branch`, `◌ dashed: replaced by a newer copy`, `time →`. Auto-open once, the first time a graph with ≥ 1 commit appears (1.06), closes on any click, never again unless pressed.
- Vertical placement: the graph is drawn from `PAD_TOP`; with auto-height there is no empty band below. Horizontal: left-aligned, auto-pan to HEAD as now.
- Editor sheet (item 11) no longer depends on the graph height.

#### 3. Lesson panel: goals inline, one-row status bar, roomier type
**Why:** Steps, goals and questions belong in one reading flow; status belongs in one line.

**Spec (`LessonPanel.tsx`, `lesson.css`):**
- Padding 20px (24px at ≥ 1920). Title `1.375rem/1.75rem` 600 (22/28). Under it one quiet line: "Easier after 1.05 Ask git what is going on and 2 more" (12px fg-3, links underline on hover, no ✕; dismiss is not needed for a one-liner). Destructive banner next, unchanged.
- Body: `0.9375rem/1.6` (15/24), `max-width: 60ch`. Paragraph gap 12px. `## Try it` and other h2: 15px/600, margin-top 28px, margin-bottom 8px. Ordered-list numbers in fg-3, 6px row gap. Code chips as now.
- **Goals block is inline**, directly after the "Try it" list (before actions and questions), titled "Goals" (15px/600) with the count right-aligned (`1 of 5`, 13px fg-3): rows 28px, 14px, filled success check / hollow circle as now; question goals clickable as now. Remove the "Ticks automatically as you work" sentence; instead the first goal that ever ticks shows a 3-second inline note under the list, "Goals tick on their own as you work.", stored in settings so it is seen once.
- Actions, questions, hints, then "After you finish" (collapsed until complete) as now. Then a final quiet line: "Stuck or want a clean start? **Reset lesson**" (link, danger only in the dialog). Remove Reset from the bottom bar.
- **Bottom bar** (pinned, 44px, border-top): `[‹ Previous]` ghost 28px with the previous title as tooltip · centre: status text 13px, `○ 1 of 5 goals · next: Fetch from origin` (truncate; when a goal ticks, show `✓ Fetch from origin` for 3s in success colour, then back) · `[Next ›]` ghost, becoming primary `Next: Resolve a conflict →` on completion (truncate at 22ch, full title in tooltip). When complete, the status reads `✓ Lesson complete`. Remove the green band and the `6/6` chip; the inline goals block shows the same with its header turning success-coloured "Goals · complete".
- Collapsed rail chip shows `1/5` as now.

#### 4. Navigation model
**Why:** Where am I, what is next to me, how do I go back, each in one obvious place.

**Spec (`screens.tsx` TopBar, new `LessonMenu`):**
- Breadcrumb styling: each crumb is a 28px pill button, fg-2, hover `sunken` + fg; separators `chevron-right` 14px fg-3. First crumb: `home` icon + "Canopy", tooltip "Home (Alt+Home)". Section crumb: "6 · Merging". Lesson crumb: `6.08 Your first conflict` with a trailing `chevron-down` 14px, `aria-haspopup="listbox"`.
- **Lesson menu** (click the lesson crumb or press `Alt+L`): popover 360px wide under the crumb, max-height 60vh, bg raised, 1px edge-2. Header row: "Merging · 8 of 17 complete" (13px fg-2) and a "Section page" link. Rows 32px: glyph (check / circle / hollow-check), id (mono fg-3), title; current row `sunken` with a 2px accent left border; keyboard ↑/↓/Enter/Esc, typing filters. Choosing a row navigates (through the leave guard).
- Prev/Next live in the lesson panel bottom bar (item 3) and on `Alt+←/→`. Prev from the first lesson of a section goes to the last of the previous section. No prev/next in the top bar.
- Home is also reachable with `Esc` from a lesson? No: `Esc` has pane meanings. Keep `Alt+Home` and the crumb.
- Section page: unchanged list, plus the row of the lesson you came from gets focus when you arrive via the crumb, so "back to the list" lands where you were.
- Settings gear gets a tooltip "Settings (Ctrl+,)". Shortcuts overlay gains a "Navigation" group.

#### 5. Leave guard
**Why:** Silent loss on leave; fear of leaving.

**Spec (`App.tsx` navigate interceptor, `Workspace.tsx`, Tauri `onCloseRequested`):**
- Track three facts in the store: `editorDirty: string[]` (paths with unsaved edits, set by `FileEditor`), `gitEditorOpen: boolean` (an `EditorSheet` request is pending), `shellBusy: boolean` (a command was sent and no prompt marker has returned for > 300ms; an action script running counts). Everything else (an in-progress merge/rebase, untracked files, unanswered questions) is state in the folder and is **kept**, so it never warns.
- Any navigation away from a lesson (crumb, menu, Prev/Next, Alt+←/→, Home, window close, opening another lesson from the section page) goes through `requestLeave(target)`. If none of the three facts is true: leave immediately. Otherwise show the dialog:
  - Title: **Leave this lesson?**
  - Body, first line by case (combine with "and" when several): "You have unsaved edits in `recipe.txt`." / "git is waiting for a commit message. Leaving cancels that command." / "A command is still running in the terminal." Second line, always: "Everything else is kept: your files, answers and progress. You can come back to this lesson any time."
  - Buttons: `Cancel` (ghost, initial focus) · `Save and leave` (primary; only when `editorDirty` is non-empty, saves then leaves) · `Leave` (secondary, or primary when there is nothing to save). No red: nothing permanent is destroyed.
  - On leave with `gitEditorOpen`: finish the editor with `null` (abort) before stopping the shell, so git exits cleanly instead of being killed mid-write.
- Window close uses the same dialog; "Save and leave" becomes "Save and quit", "Leave" becomes "Quit".
- **Resumed-lesson notice:** when a lesson opens with an existing folder (not the first open, not after Reset), the terminal prints one fg-3 italic line above the first prompt: `— continuing where you left off; Reset lesson starts over —`. This is the "your work is kept" message, shown exactly where the learner looks.
- Reset dialog body adds: "Leaving a lesson never does this; only Reset does."

#### 6. Branch element: fixed design
**Why:** The 7.04 screenshot reads "HEAD → origin/main".

**Spec (`GraphView.tsx` `Flags`, `Flag`, `Node`):**
- Geometry: node r 6; HEAD ring r 11, 2px, fg; `LANE = 64` (was 56); `COL` as now; subject label baseline at `y + 24` (was +20), 10px → `0.6875rem` mono? No: subjects are prose, keep sans `0.6875rem` fg-2, 15 chars with ellipsis, centred, and **not drawn under a node that has the HEAD ring when the pill row is present** (it moves to the tooltip/commit card). Reason: ring bottom at y+11, label cap at y+16, and the stub crosses it.
- **Tip row** (the commit is a branch tip or has HEAD): labels sit on one horizontal row at node level, right of the node. Stub: 2px line from `x+7` to `x+15` in the current branch colour (or the first label's colour). Pills start at `x+15`, height 20, radius 10, padding 0 8, 6px gap, text `0.6875rem` mono 600. Order: current branch, other local branches, remote-tracking, tags, bisect badges.
- **HEAD**: never a floating word. The current branch pill reads **`HEAD → main`** (arrow `→`, `HEAD` at weight 500, `main` 600), filled in the branch colour; this matches `git log --oneline` output the learner sees in the terminal. The ring stays on the node. Detached HEAD: an outlined pill (1.5px solid fg-2, text fg) reading `HEAD` in first position, plus the existing warning banner; the key popover explains it. Worktree HEADs: outlined pill `HEAD · hotfix-wt`.
- **Remote-tracking pill**: dashed 1.5px outline in the hue of the local branch of the same name, transparent fill, text in the hue, `origin/` at weight 400. When it points at the same commit as its local branch it goes directly after that local pill, so `[HEAD → main] [origin/main]` reads as one statement.
- **Tag**: polygon as now, 20px tall to match, after remotes.
- **Non-tip labels** (a remote behind the local tip, a tag on an old commit): stack **above** the node, centred, first pill bottom at `y − 14`, each further pill 24px higher; more than two becomes one pill `+N` with a tooltip listing them; the subject stays below. `LANE = 64` leaves 20px clear between a stacked pill and the subject label of the lane above.
- Multiple local branches on one tip: `[HEAD → main] [feature]` row; if the row would exceed the pane width, pills after the second collapse to `+N`.
- Edge ends: edges stop at the node circle; the stub is the only thing between ring and pill.
- Check the result against the three cases: 7.04 (`●─[HEAD → main][origin/main]`), 6.06 (`●─[HEAD → main]` and `●─[export]`), 7.17 (`●─[HEAD → main][origin/main][v1.1 ●]`).

#### 7. Text size: implement as 2.1
**Spec (`styles.css`, `theme.ts`, `GraphView.tsx`):** tokens to rem; `--text-scale` on `:root` from the setting; body `0.9375rem` for `.lesson-md`; pane widths in rem (`clamp` as in item 1); `fontSize = round(13 * scale)` for xterm; graph label font in rem and `measureText` widths; `Ctrl+=/−/0` bound to the setting; live preview in the select.

#### 8. Inspector tabs: decisions
**Why:** Each tab must name who it serves, in which lessons, or go.

| Tab | Who / where | Verdict | Spec |
|---|---|---|---|
| **Files** | Everyone who edits (`.gitignore` 2.10, conflicts 6.09, creating files 1.02, renames 2.12); 12 lessons name it. | **Keep, on demand** | Drawer (item 1). Tree follows cwd (done). Opens automatically for `panels: [files]`; add that to the 12 lessons that mention it. Status letters keep tooltips. |
| **Changes** | 4 lessons (2.07, 2.08, 6.08, 6.09). | **Remove** | The point of those lessons is reading `git diff` in the terminal; a second rendering teaches the panel, not git. Delete `ChangesTab`, the `diff` panel id and the scope select. Edit the four `content.md` files to say "read the output in the terminal". Later, if wanted: gutter change marks in the file editor (added/changed lines vs HEAD) give the same information in context. |
| **Areas** | 28 lessons, the hardest early concept (three areas). | **Keep, move, rename** | Not a side tab: a full-width **strip in the centre column** between graph and terminal, only in lessons that declare `three-areas`. Header text: "Where your changes are: **Working tree** (files on disk) → **Staging** (what the next commit will contain) → **Last commit (HEAD)**". Height 132px, three equal columns, file cards as now (name, first 3 lines, "differs" chip), horizontal scroll if > 4 files. Collapsible to a 28px bar with the same header text. In section 1 lessons (1.05, 1.06) the HEAD column shows "(no commits yet)". This gives the three-column idea the width it needs and makes it read left-to-right like the graph. |
| **.git** | 20 lessons: 1.03 (find the hidden folder), 5.12 (refs), all of 14. | **Keep, rename, scope** | Tab label "Inside .git", shown in the Files drawer only for those lessons; opens automatically there. Sections Refs / Index / Objects as now. |

Net effect: the right drawer has one tab (Files) in 205 lessons and two (Files, Inside .git) in 20; the centre gets a strip in 28. No empty tabs, no changing tab sets.

### P2

#### 9. Three-area strip visual spec (companion to item 8)
`Workspace.tsx` centre column order: graph → areas strip → terminal. Strip: bg surface, border-top/bottom edge, padding 8px 12px; column headers 11px caps fg-3 with the plain-words subtitle inline; cards 1px edge-2, radius 6, mono 11px content, 96px tall; the card whose version changed in the last snapshot gets a 240ms accent border pulse (opacity only). Empty state text per column instead of "No files yet": Working tree "Nothing here yet", Staging "Nothing staged", HEAD "No commits yet".

#### 10. Terminal header
Content, left to right: `Terminal` label (keep, it is where you type) · `in cafe/notes` mono fg-2 (hide when at the repo root; "outside the learning folder" stays) · spacer · `Files` ghost button with `panel-right` icon (opens the drawer, pressed state when open) · `Clear` ghost. The first-run hint row: show once, and **auto-dismiss on the first command** instead of waiting for ✕ (`usedCommand` is already logged). Copy stays.

#### 11. Editor sheet sizing
With auto-height graphs the sheet cannot borrow the graph height. Spec: sheet height `max(40% of the centre column, 280px)`, slides down over the graph and the top of the terminal; terminal keeps its header visible below the sheet so the learner sees git waiting. Title row as now; add the file name for `other` ("Edit `.git/rebase-merge/git-rebase-todo`" is noise, so keep "Rebase todo").

#### 12. Resumed-lesson notice and lesson-open focus
Item 5's terminal line. Also: when returning to a complete lesson, the bottom bar reads `✓ Lesson complete` and Next is primary immediately; no band.

#### 13. Section page density
Rows are 40px with only a title. Add the one-line lesson summary when available (first sentence of `content.md`, 12px fg-3, truncate) on the right half, and the "Next" tag as now. Keep the quiet "Reset section progress" link at the bottom. Mark complete sections with "Section complete" under the bar (exists in code; verify it shows).

#### 14. Home
Fine. Two small things: "START HERE" / "NEXT UP" caps → sentence case 12px fg-3 ("Start here"); the overall bar hidden at 0 (done). Nothing else.

#### 15. Settings sheet
Rename group "Help › Keyboard › Keyboard shortcuts" to a single row "Keyboard shortcuts" with a `keyboard` icon. "Lesson content" card: move "Canopy only goes online when you press this button." into the card's `m` line as "Checked never · offline until you press the button". Width stays 480px; at 140% text, 30rem.

#### 16. Toasts
Fine. Move the stack to the bottom-right of the **centre column** (not the window) so a toast never covers the drawer's editor Save button. Max 3, 5s as now.

#### 17. First run
Matches the ruling. Add the folder path as the decisions required: "…inside lesson folders Canopy creates in `~/.local/share/canopy/lessons`. Your own projects are never touched."

#### 18. Git gate
Matches the spec. Change the detail box's first line from "Looked for: git on PATH" to "Looked in: your PATH" and drop the box entirely when git is simply missing (one line "Found: nothing" is not information). Keep the box for the too-old case.

### P3

#### 19. Graph: subjects and ids
Subject labels at 15 chars truncate real messages too early ("Shorten the si…"). Use 18 chars at `COL 112`, and show the full subject in the commit card (exists). Ids remain a setting.

#### 20. Graph: rewritten history
9.16's ghost row and copy arrows (now hover-only) are fine; add the key popover entry "◌ dashed: replaced by a newer copy" (item 2) and label the ghost lane once with a 10px fg-3 caption "old commits (no branch points here)" at the left edge of the lane.

#### 21. Compare with origin
Fold into the repo switcher as a fourth segment "Clone + origin" instead of a separate button; one control, one place.

#### 22. Dialog polish
Dialog width 440 at Default text; `27.5rem` so it scales. Initial focus on Cancel for destructive dialogs (done); on the primary for the leave dialog's "Save and leave".

#### 23. Rail chip
The left rail's `1/5` chip: add the lesson title vertically so a collapsed lesson panel still says which lesson this is.

---

## 4. Answers to the implementer's doubts

**(a) Should the inspector exist by default?** No. Make it a drawer that is closed by default and opened by the "Files" button in the terminal header, `Alt+4`, or the lesson itself (`panels: [files]`, `[inside-git]`). The rail goes. Items 1, 8, 10.

**(b) Horizontal graph with mostly empty pane?** The horizontal graph is right: it matches the time axis in the lesson text and `log --graph`, and a horizontal graph can be short. The pane is wrong, not the graph: size the pane to the lanes (item 2). Then the terminal gets the rest automatically, and the lesson panel gets wider from item 1. Do not make the graph vertical; a vertical graph would need the height the lesson panel needs.

**(c) Graph key line?** Not as a permanent row. As a popover from a small "Key" button, auto-opened once (item 2). The ring and the `HEAD → main` pill (item 6) also reduce what the key must explain.

**(d) "Easier after" above the lesson text?** Yes, but as one 12px line directly under the title, part of the header, not a block above the body. It is metadata about the lesson; the learner should see it before reading, then forget it. One line, no close button (item 3).

**(e) Goals vs "Try it" steps.** Keep both meanings and put them next to each other in the reading flow: "Try it" (numbered, how) immediately followed by "Goals" (checklist, what is checked), then the questions. The pinned region shrinks to one status line that shows the count and the next unmet goal, and flashes a goal when it ticks. The duplication the owner feels comes from seeing the same facts in two separate regions; adjacent, they read as "do this, and this is how you know it worked".

**(f) What else to remove.** The graph key row; the "Ticks automatically" line (once-only note instead); the terminal hint's ✕ (auto-dismiss on first command); the single-repo graph header and its collapse button; the right rail; the "Lesson complete" band and `6/6` chip; the Changes tab; Reset lesson from the bottom bar (link at the end of the lesson instead); the "Compare with origin" button as a separate control; the `[cmd -> exit 0]` lines if they ever reach a real terminal (preview only, I assume); "START HERE" caps.

---

## 5. Wireframes

### 5.1 Lesson workspace, 1440x900, single-repo lesson (6.08), drawer closed

```
┌ top bar 44 ──────────────────────────────────────────────────────────────────────────────────────┐
│ ⌂ Canopy  ›  6 · Merging  ›  6.08 Your first conflict ▾                                     ⚙   │
├───────────────────────────┬──────────────────────────────────────────────────────────────────────┤
│ LESSON PANEL 403          │ GRAPH (auto height: 2 lanes → 36+64+36 = 136 … here 2 lanes = 200)   │
│ pad 20                    │  ⚑ Merge in progress · conflict                                      │
│ Your first conflict    ▣  │                                                                      │
│ Easier after 1.05 Ask git │        ●────────────●  ─[new-title]                                  │
│ what is going on, 2 more  │       /    Shorten the si…                                           │
│                           │  ●───●───────────────────◎ ─[HEAD → main]                            │
│ A three-way merge         │  Add README  Add home page                                           │
│ combines changes from     │                                                              ? Key   │
│ both sides. When the two  ├──────────────────────────────────────────────────────────────────────┤
│ sides changed the same    │ Terminal  in cafe                                    [▤ Files] Clear │
│ lines differently, git    │ cafe (main) $ git merge new-title                                    │
│ cannot know which version │ Auto-merging index.html                                              │
│ is right. …               │ CONFLICT (content): Merge conflict in index.html                     │
│                           │ Automatic merge failed; fix conflicts and then commit the result.    │
│ ┌───────────────────────┐ │ cafe (main|MERGING) $ █                                              │
│ │ <<<<<<< HEAD          │ │                                                                      │
│ │ the line as it is on  │ │                                                                      │
│ │ your branch           │ │                                                                      │
│ │ =======               │ │                                                                      │
│ │ …                     │ │                                                                      │
│ └───────────────────────┘ │                                                                      │
│                           │                                                                      │
│ Try it                    │                                                                      │
│ 1. Merge new-title into   │                                                                      │
│    main. git stops with a │                                                                      │
│    conflict in index.html.│                                                                      │
│ 2. Check the status…      │                                                                      │
│                           │                                                                      │
│ Goals             1 of 6  │                                                                      │
│ ✓ Start the merge of      │                                                                      │
│   new-title and hit the   │                                                                      │
│   conflict                │                                                                      │
│ ○ Check the status during │                                                                      │
│   the conflict            │                                                                      │
│ ○ Look at the diff …      │                                                                      │
│ ○ Answer: the text on …   │                                                                      │
│                           │                                                                      │
│ ┌ Question 1 of 3 ──────┐ │                                                                      │
│ │ Which branch's text…  │ │                                                                      │
│ └───────────────────────┘ │                                                                      │
│ ▸ After you finish        │                                                                      │
│ Stuck? Reset lesson       │                                                                      │
├───────────────────────────┤                                                                      │
│ ‹  ○ 1 of 6 · next: Check │                                                                      │
│    the status…        Next ›                                                                     │
└───────────────────────────┴──────────────────────────────────────────────────────────────────────┘
```
Vertical budget at 900px: top bar 44, lesson scroll area 812 (was ~470), bottom bar 44. Centre: graph 200 (two lanes), terminal 612 (was ~420).

### 5.2 Same window, lesson with the three-area strip (2.03) and the drawer open

```
├───────────────────────────┬──────────────────────────────────────────────┬─────────────────────┤
│ LESSON 403                │ GRAPH 1 lane → 136                           │ Files  Inside .git ▣│
│                           │  ●──────────◎ ─[HEAD → main]                 │ ▾ project           │
│ Staged vs changed-after-  │  Add README  Add shopping l…                 │   ▸ .git (dim)      │
│ staging                   ├──────────────────────────────────────────────┤   README.md         │
│ …                         │ Where your changes are:  Working tree (files │   todo.txt       M  │
│                           │ on disk) → Staging (next commit) → Last      │                     │
│                           │ commit (HEAD)                            ▾   │                     │
│                           │ ┌───────────┐  ┌───────────┐  ┌───────────┐  │                     │
│                           │ │todo.txt   │→ │todo.txt   │→ │todo.txt   │  │                     │
│                           │ │buy milk   │  │buy milk   │  │(absent)   │  │                     │
│                           │ │buy bread  │  │  differs  │  │           │  │                     │
│                           │ └───────────┘  └───────────┘  └───────────┘  │                     │
│                           ├──────────────────────────────────────────────┤                     │
│                           │ Terminal  in project          [▤ Files] Clear│                     │
│                           │ project (main) $ █                           │                     │
```
Centre at 1440 with the drawer (346): 691px, still ≥ 560 minimum; terminal 80+ columns.

### 5.3 Navigation

```
 Top bar (every screen)
 ┌────────────────────────────────────────────────────────────────────────────┐
 │ [⌂ Canopy]  ›  [6 · Merging]  ›  [6.08 Your first conflict ▾]          [⚙] │
 └──────┬───────────────┬───────────────────────┬─────────────────────────────┘
        │ Home          │ Section page          │ Lesson menu (popover, Alt+L)
        ▼               ▼                       ▼
   Home: Start/Continue  Section 6: list      ┌ Merging · 8 of 17 complete  Section page ┐
   card + 15 sections    of 17 rows,          │ ✓ 6.06 Squash merge                       │
                         focus returns        │ ✓ 6.07 Read merges in history             │
                         to the row you       │ ▌○ 6.08 Your first conflict   (current)   │
                         came from            │ ○ 6.09 Resolve a conflict                 │
                                              │ ○ 6.10 Abort a merge                      │
                                              │ …                                         │
                                              └───────────────────────────────────────────┘
 Lesson panel bottom bar
 ┌───────────────────────────────────────────────┐
 │ [‹]   ○ 1 of 6 goals · next: Check the status  [Next ›] │   in progress
 │ [‹]   ✓ Lesson complete          [Next: Resolve a conflict →] │   complete (primary)
 └───────────────────────────────────────────────┘
 Keyboard: Alt+← / Alt+→ prev/next · Alt+L lesson menu · Alt+Home home · Ctrl+, settings
 Every move passes requestLeave(): instant unless unsaved edit / git editor open / command running.
```

### 5.4 Leave dialog

```
┌ Leave this lesson? ──────────────────────────────────────────┐
│ You have unsaved edits in recipe.txt, and git is waiting for │
│ a commit message. Leaving cancels that command.              │
│                                                              │
│ Everything else is kept: your files, answers and progress.   │
│ You can come back to this lesson any time.                   │
│                                                              │
│                        [Cancel]  [Leave]  [Save and leave]   │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Order of work

Items 1, 2, 3 together (they are one layout change); then 6 (graph labels) and 8/9 (tabs and the strip); then 4 and 5 (navigation and the guard); 7 (text size) can run in parallel since it is tokens. P2 and P3 after the owner has used the result for a day.
