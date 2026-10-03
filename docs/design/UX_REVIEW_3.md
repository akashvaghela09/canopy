# UX review 3: lesson panel, text size, settings, hints

Reviewed v0.3.0 (commit `37863a1`) against the owner's feedback after using it. I read `UX_REVIEW.md`, `UX_DECISIONS.md` (with Round 2), `REVIEW_2.md`, `LESSON_FORMAT.md`, the source (`LessonPanel.tsx`, `Workspace.tsx`, `App.tsx` `SettingsSheet`, `ui.tsx`, `Inspector.tsx`, `styles.css`, `theme.ts`, `lesson.css`) and lessons 1.01, 1.07, 2.03, 4.12, 6.08, 7.04, 7.17 and 12.13. Screenshots were taken from the preview at 1366x768, 1440x900 and 1440x1400, in light and dark; they are in `/tmp/claude-1000/ux3/`. Preview artifacts (`[cmd -> exit 0]` lines, "continuing where you left off" in a fresh lesson, empty Files and Areas data, the blank strip at the bottom of headless captures) are ignored.

Content numbers used below (all 227 lesson folders):

| | median | max |
|---|---|---|
| Reading (before `## Try it`) | 109 words | 289 |
| Try it (steps) | 69 words | 183 |
| What just happened | 46 words | 121 |
| Goals per lesson | 5 | 8 |
| Questions per lesson (142 lessons have any) | 1 | 7 |
| Hints per lesson (224 lessons have any) | 3 | 4 |

209 lessons use `## Try it` and `## What just happened`. 18 do not: the boss lessons (1.07, 7.17, …) are a single task list, 4.12 uses `## The cases`, and 12.13 and 13.15 use `## Goals` as a content heading. 12 lessons have action buttons.

---

## 1. Verdict

v0.3.0 fixed the big layout mistake: the lesson panel is now wide and the drawer is closed by default. The lesson panel itself is still a long document with a tool panel bolted onto its end. The owner's complaint is accurate. Reading, doing, checking, getting help and moving on all sit in one scroll, and the only boundary between reading and doing is a 15px bold "Try it" that looks like every other heading.

Text size is wrong at the model level, not in the details. It scales the root `font-size`, so every rem in the app grows, panel widths included, while every px (button heights, bars, paddings) stays put.

The settings sheet does not lack space. It lacks a layout. Seven kinds of control are squeezed into a 140px-label grid, and each one is styled differently.

All four points can be fixed without new concepts:
- two tabs in the lesson panel;
- two text-size settings with a clear scope;
- one grouped settings list;
- one hint button.

---

## 2. Honest critique, including what you got wrong

### 2.1 You implemented REVIEW_2 literally, including its mistakes
- **Action buttons sit far from the step that names them.** In 7.04, step 1 says "Press **Teammate pushes two commits** in the lesson panel". The button renders *after the whole Goals list*. At 1440x1400 it is at y=1056; at 1366x768 it is two screens down from the step (`l704tall.png`). REVIEW_2 said "actions, questions, hints after goals". That order made sense for questions, but not for a button the first step tells you to press. You should have caught it the first time you ran 7.04.
- **"After you finish: what just happened" as a collapsed `<details>`** before completion is a spoiler with a label. After completion it opens in place, at the bottom of the scroll. The learner is not looking there: they are looking at the terminal, or at the bottom bar that just said "Lesson complete". The recap is shown at the right time but in the wrong place.
- **The hint section** ("Hints" heading, "Show hint 1 of 3" button, "That is the last hint.") sits below the questions, below the fold in every captured lesson. Help that you have to scroll to find is not help.

### 2.2 Text size: the mixed-unit model you shipped
- `App.tsx` sets `document.documentElement.style.fontSize = textScale%`. That scales every rem: the lesson panel width (`clamp(22.5rem, 28vw, 32rem)`), the drawer width, the stored drag widths (kept in rem), and dialog widths. The owner noticed that the lesson panel gets wider when the text grows. That is this line.
- Meanwhile, `--spacing: 4px` keeps every `h-7`, `h-11` and padding in px. At "Largest" the text is 18px inside 28px buttons and a 44px bottom bar. The result is not "bigger text"; it is a different, cramped layout.
- One "Text size" setting drives the terminal too (`fontSize = round(13 * scale)`). Terminal font size is a personal, separate preference: people want a bigger terminal *or* bigger prose, rarely both together. The owner asked for it back. Round 2 removed it on Fable's advice, but that was a wrong call and you agreed to it.
- `Ctrl+=` changes everything at once, so a learner who wants a bigger terminal also reflows the lesson.

### 2.3 Settings sheet
Look at `settings.png`. The sheet is 480px wide, which is plenty. The cramped look comes from four things:
- **A 140px label column plus a control column of about 290px.** The help text under Text size wraps mid-shortcut ("Ctrl+-" / "also work."). "Show the graph as a text list (screen readers)" wraps onto two lines. The "Graph" label floats vertically between two checkboxes.
- **Seven control styles in one sheet:**
  - an inline radio row (Theme);
  - two native selects (Text size, Reduce motion);
  - checkboxes;
  - a bordered card (Lesson content, the only card);
  - a red text button (Reset all progress);
  - a teal link (Keyboard shortcuts);
  - raw text with `<br>` (About).
- **The wrong controls for the job.** "Reduce motion: Follow system / Always" is a boolean shown as a select. The text-size select is 90px wide and gives no sense of scale.
- **It breaks your own rulings:**
  - "Reset all progress…" is red at rest. Ruling 14 says red belongs only in the confirm dialog.
  - REVIEW_2 item 15 asked for one "Keyboard shortcuts" row. You built a "Help" group holding a "Keyboard" label holding a "Keyboard shortcuts" link: three words for one row.
- **The 11px uppercase group titles** (APPEARANCE, LESSONS, HELP, ABOUT) are the dashboard texture that two reviews asked to remove.
- **The 40% black scrim** darkens the lesson panel and terminal. Those are exactly the things you would want to watch while changing a size.

### 2.4 Lesson panel details
- **"Try it" is not visibly a boundary.** The `.lesson-md h2` is `--text-base` (14px) at weight 600 with a 20px top margin. That is *smaller* than the 15px body. The main structural break in every lesson is the weakest heading on screen.
- **Goals are 13px** (`text-sm`) under 15px steps. The checklist the learner is told to watch reads as fine print.
- **Question buttons are `size="sm"`** (24px tall, 12px text) inside 15px prose. "Check answer" looks like a footnote.
- **The bottom bar truncates its most important words.** At 1366 it shows "Lesson complet" next to "Next: Bring fetched work i…" (`l704s.png`). In progress, it shows "0 of 5 goals · next: Print the folder you ar…": the goal label is cut off, so "next:" carries no information.
- **The bottom bar repeats itself.** "Lesson complete" appears in the bar while "Goals · complete" appears in the panel.
- **The section-change button says "Next section"** without the section's name. REVIEW_2 specified "Next section: Merging →", and you dropped the name.
- **Tick detection is written twice** (`GoalsList` and `BottomBar` each keep a `prev` ref and diff the goals). Two effects fire for one event. Today that is a code smell; once tabs make both components conditional, it will be a bug.
- **`showHint` has no cap.** `hintsShown += 1` keeps counting when Alt+H is pressed after the last hint. It is harmless with `slice`, but it is wrong state.
- **The Inspector tab strip claims `role="tablist"`** but has no arrow-key handling, no `aria-controls` and no roving tabindex. If you copy it for the lesson tabs, you copy the gap.

### 2.5 Outside the brief, noticed in passing
- The graph Key popover auto-opens over the right third of the graph, which in 7.04 is where the new commits arrive (`l704s.png`). It should open once only *after the first command*, or anchor below the Key button without covering nodes. P3.

---

## 3. Owner point 2 first: the text-size model

This comes first because the lesson-panel specs below depend on it.

### 3.1 The model

There are **two settings, and each scales exactly one surface.** Everything else is fixed.

| Setting | Key | Scales | Does not scale | Steps (px) | Default |
|---|---|---|---|---|---|
| **Lesson text** | `lessonText` | Everything *inside* the lesson panel's title block, tab panels and hint card: title, "Easier after", body, steps, code chips and blocks, question cards (prompt, options, input, Check button), action buttons, goals, recap, reset line | Panel width, tab strip, bottom bar, top bar, graph, areas strip, drawer, dialogs, settings, Home and Section screens | 13 · 14 · **15** · 16 · 17 · 18 · 20 · 22 | 15 |
| **Terminal and editor text** | `codeText` | xterm font, the git editor sheet (`EditorSheet`), the file editor in the drawer (`CodeEditor`, via `--editor-font-size`) | Terminal header, banners, everything else | 11 · 12 · **13** · 14 · 15 · 16 · 18 · 20 | 13 |
| *(fixed)* Interface | none | Chrome stays at the design sizes: 13px controls, 12px meta | n/a | n/a | n/a |

The rules:
- **Pane widths never depend on text size.** All widths are in px, with `vw` for the default clamp.
- **The root `font-size` is always 16px.** Delete `App.tsx` line 54.
- **No third setting for the whole interface.** OS display scaling covers low vision. If testers ask, add "Interface zoom" later through Tauri's `WebviewWindow.setZoom` (P3). That scales everything, widths included, which is honest for a zoom.

### 3.2 Implementation spec
- **`styles.css`:**
  - Keep `--text-*` tokens in rem; they now mean fixed px, because the root is fixed.
  - Add `--lesson-fs: 15px` and `--code-fs: 13px` on `:root`, set from the settings in `App.tsx`: `document.documentElement.style.setProperty("--lesson-fs", lessonText + "px")`.
- **`LessonPanel.tsx`:**
  - The title block, both tab panels and the hint card get `className="lesson-scale"`, with `.lesson-scale { font-size: var(--lesson-fs); }`.
  - Everything inside uses **em**, never rem or Tailwind `text-sm` (table below).
- **Buttons inside `.lesson-scale`:** add a `scaled` prop to `Button` in `ui.tsx`. It swaps the fixed height and size for `min-h-[2em] px-[0.8em] text-[0.875em]` (sm: `min-h-[1.75em] text-[0.8em]`). Radios, checkboxes and the text input in `QuestionCard` use `width/height: 1em` and `h-[2em]`.
- **`Workspace.tsx` widths:**
  - Lesson panel default `clamp(360px, 28vw, 512px)`.
  - Drawer `clamp(320px, 24vw, 416px)`.
  - Editor mode `min(50%, 720px)`.
  - Drag ranges 320–576 and 288–640 px.
  - Store `lessonPx` and `drawerPx`. Migrate stored rem × 16 once.
  - Delete `remPx()`.
- **Terminal:** `fontSize = codeText`. `CodeEditor` reads `var(--code-fs)`. Rename `--editor-font-size` to `--code-fs`.
- **Graph:** `GraphPane` no longer receives `scale`. Labels go back to fixed sizes; keep `measureText`.
- **Migration** (one time, in `App.tsx` boot): if `textSize` exists, set `lessonText = nearest step to 15 × textSize/100` and `codeText = nearest step to 13 × textSize/100`, then delete `textSize`. Example: Larger (125) maps to 18 and 16.
- **Keyboard:** `Ctrl+=` / `Ctrl+−` / `Ctrl+0` change **the surface that has focus**. In the terminal, git editor or file editor, they change `codeText`; anywhere else, `lessonText`. Each press shows a 1.2s pill in the top-right corner of the surface that changed:
  - Style: 24px tall, bg raised, 1px edge-2, 12px fg-2.
  - Text: "Terminal text 14" or "Lesson text 16".
  - Accessibility: `aria-live="polite"`, so screen readers hear the same thing.
  - Shortcuts overlay row: "Ctrl+= / Ctrl+- / Ctrl+0: Text size of the lesson or terminal, whichever you are in".
- **Measure check:** at 1440 the panel is 403px with 20px padding, so the content is 363px. Body at 15px gives about 50 characters per line; at 22px about 34. 34 is short but readable for a learner who chose it, and they can drag the panel wider. Do not auto-widen.

### 3.3 Em scale inside `.lesson-scale` (default 15px shown)

| Element | em | px at 15 | Weight / line-height |
|---|---|---|---|
| Title h1 | 1.4667em | 22 | 600 / 1.27 |
| "Easier after" line | 0.8em | 12 | 400 / 1.4, fg-3 |
| Body, steps, list items | 1em | 15 | 400 / 1.6 |
| Content h2 (except "Try it", see 4.3) | 1em | 15 | 600, margin 1.6em 0 0.5em |
| Inline code, code blocks | 0.8667em | 13 | mono |
| Goals header | 1em | 15 | 600 |
| Goal row | 0.9333em | 14 | 400 / 1.43, icon 1.2em |
| Question prompt | 1em | 15 | 500 |
| Question option, input | 0.9333em | 14 | row min-height 2.2em |
| Hint text | 0.9333em | 14 | 400 / 1.55 |
| Section meta ("Question 1 of 3", "Hint 1 of 3", "Ran 2×") | 0.8em | 12 | fg-3 |

Spacing inside the lesson content (paragraph gaps, card padding) also becomes em, so a 22px lesson does not look crushed: `p { margin-bottom: 0.8em }`, `pre { padding: 0.8em }`, cards `padding: 0.8em`. The panel's outer padding (20px), the tab strip and the bottom bar stay px.

---

## 4. Owner point 3: lesson panel structure

### 4.1 What the learner does, in order
1. Reads the idea once (about 2 minutes, a median of 109 words).
2. Works in the terminal for 5–10 minutes, glancing at the steps, pressing an action button, answering questions, watching goals tick, sometimes asking for a hint.
3. Glances back at the reading once or twice: a flag table (7.04) or the conflict markers (6.08).
4. Finishes, reads the short recap, moves on.

Steps 2 and 3 are the design problem. Phase 2 needs steps, actions, questions and goals *together*. Phase 3 needs the reading *one action away, without losing your place in the steps*.

### 4.2 Options considered

| Option | Scrolling | Looking back while typing | Goals ticking while working | Questions | Keyboard / screen reader | Verdict |
|---|---|---|---|---|---|---|
| **A. Three tabs: Reading / Try it / Goals** (owner's idea) | Each tab short | One click, place kept | **Bad**: goals are in another tab from the steps, so every tick sends the learner hunting for the Goals tab or relying on the bar | Split: a Goals tab would hold either the inputs (away from the steps that ask for them) or nothing but checkmarks | Fine with ARIA tabs | Reject the Goals tab. Goals are "how you know the steps worked", so they must sit next to the steps. |
| **B. Two tabs: Read / Try it** | Read: median ~300px. Try it fits one screen at 1440x900 in most lessons (estimate below) | One click; each tab keeps its own scroll position | Visible in Try it; bar flash when on Read | With the steps that ask for them | ARIA tabs, arrows, live region for ticks | **Recommend** |
| **C. One scroll with strong section headers + sticky jump links** | Still long (median ~700–900px of content) | Scrolling up loses your place in the steps; jump links are tabs that do not hide anything | Below the fold in long lessons | Same as today | Simple, find-in-page works | Second best. It fixes the boundary but not the "look back" problem. |
| **D. Split panel: reading on top, Try it docked below, resizable** | Two scroll regions in a 400px column | Both visible | Visible | In the lower half | Two scroll regions are harder to navigate | Reject: both halves are cramped at 768px tall. |
| **E. Wizard: Read → Do → Done with Next buttons** | Short | Hides the reading behind "Back" | Visible | Fine | Fine | Reject as a mode; borrow its "Try it →" button at the end of Read. |

Why B is not "hidden content":
- The two tabs are **sequential, not parallel**. The usual objection to tabs (users miss content in unvisited tabs) is handled by ending Read with a "Try it →" button.
- Opening the lesson on the right tab handles the rest (4.4).
- Each tab owns its scroll, so going back to the reading and returning lands exactly where you were.

Estimated fit for Try it, 7.04 at 1440x900 (scroll area 702px, see 4.7):
- steps about 330px;
- inline action 40px;
- one number question 130px;
- five goals 176px;
- total about 676px, which fits.

6.08 (six steps, three questions) scrolls by about one card. Questions and goals are the only parts that grow.

### 4.3 The recommended structure

```
Title block (pinned)    title, "Easier after" line
Tab strip (pinned)      Read | Try it                               [Hint]
Hint card (pinned, only while open)
Tab panel (scrolls)     Read:   notices, reading, [Try it →]
                        Try it: steps (actions inline) · questions · Goals ·
                                What just happened (only once complete) · reset line
Bottom bar (pinned)     ‹ · status · Next
```

**Splitting `content.md`** (`splitContent` in `LessonPanel.tsx`):
- **Read** = everything before the first `## Try it`.
- **Try it** = from after the `## Try it` heading line (drop the heading: the tab says it) up to `## What just happened`.
- **Recap** = the `## What just happened` body, without its heading.
- **Lessons with no `## Try it`** (boss lessons, 18): **no tab strip**. The whole text renders as one panel, followed by questions, Goals and recap. The strip row keeps only a left label, "Challenge" (13px fg-2), and the Hint button on the right.
- **Content fixes**, plus one line in `LESSON_FORMAT.md` ("`## Try it` is required except in boss lessons"):
  - 4.12: rename `## The cases` to `## Try it` and keep the four bold case labels.
  - 12.13 and 13.15: rename `## Goals` to `## Your tasks`. It collides with the app's Goals heading.

**Title block** (pinned, not scrolling):
- Padding 16px 20px 12px (24px horizontal at ≥1920 wide, as now).
- Title row: h1 (lesson-scaled) and the collapse IconButton (24px, top-aligned) as now.
- "Easier after" line under it. Make "and 2 more" a button that opens the lesson menu (Alt+L) instead of dead text.
- No border below; the tab strip draws one.

**Tab strip** (`LessonPanel.tsx`, new `LessonTabs`):
- Height 36px. Border-bottom 1px edge. Padding 0 12px 0 20px. Chrome size, not scaled.
- **Tabs:** `Read` and `Try it`, text 13px weight 500, 24px gap, height 36.
  - Selected: fg with a 2px fg bottom border (the same look as the drawer's Files tab).
  - Unselected: fg-2, hover fg.
  - No icons and no counts. The count lives in Goals and the bar; a third copy in the tab label is noise.
- **Right side:** the Hint button (section 5).
- **ARIA:**
  - The strip has `role="tablist"` and `aria-label="Lesson"`.
  - Each tab has `role="tab"`, `id`, `aria-controls`, `aria-selected`, and a roving tabindex: the selected tab has `0`, the other `-1`.
  - ←/→ switch tabs and activate them (automatic activation, since content is local). Home/End jump to the first or last tab.
  - Each panel has `role="tabpanel"`, `aria-labelledby` and `tabIndex={0}`, so it can scroll by keyboard.
  - Fix the same gaps in `Inspector.tsx` while you are there.
- **Shortcut:** `Alt+1` (focus lesson) focuses the selected tab. No new chord; arrows do the rest.

**Read panel:**
- Order: the Preflight banner, the destructive banner (as now, 16px gap), then the reading markdown.
- At the end, 24px below the last paragraph: a `secondary` scaled button "**Try it →**" that selects the Try it tab and focuses the tab panel.
- No other controls in Read: no goals, no actions, no reset line.

**Try it panel:**
- **Steps.** The `## Try it` content.
  - Ordered-list numbers in fg-3, 0.4em row gap.
  - **Actions render inline:** in the markdown `li` renderer, if the item's text contains an action's label (the content always writes it as `**<label>**`), render that action block directly under the item's text, indented with the item, margin-top 0.5em.
  - Actions that no step mentions render after the list (fallback; covers boss bullet lists the same way).
- **Questions.** After the steps, 1.2em apart.
  - Card: 1px edge, radius 6, padding 0.8em; success border when correct.
  - "Question 1 of 3" meta only when there is more than one.
  - "Check answer": `scaled`, default size (not sm).
- **Goals.** 1.6em below the last question.
  - Header "Goals" with right-aligned "2 of 5" (meta fg-3).
  - Rows as now, at the em sizes in 3.3.
  - Question goals stay clickable and scroll to their card (same tab).
  - When complete, the header reads "Goals · complete" in success, as now.
  - The one-time "Goals tick on their own as you work." note stays.
- **What just happened.** Rendered **only when the lesson is complete**. Nothing before: no `<details>`, no "After you finish".
  - Placement: directly under Goals, 1.2em gap.
  - Shape: a block with a 2px success left border, padding-left 0.8em, a heading "What just happened" (1em/600), then the recap.
  - It fades in (160ms, none with reduced motion).
  - It does **not** auto-scroll: the bar handles that (4.6).
  - When the learner returns to a completed lesson, it is simply there.
- **Reset line.** Last, 2em below, meta size fg-3: "Stuck, or want a clean start? **Reset lesson**". For optional lessons, add " · **Skip lesson**". Unchanged copy.

**Boss lessons:**
- The single panel holds: Preflight and destructive banners → content → actions (inline in bullets, or fallback) → questions → Goals → recap → reset line.
- No "Try it →" button.

### 4.4 Which tab is selected
- **First open** of a lesson (no commands run, no saved answers, not complete): **Read**.
- **Resumed** (`update.commands > 0` or any saved answer) or **complete**: **Try it**.
- **After Reset lesson:** Read. Reset means "start over".
- The selection is remembered per lesson for the session (a `Map<lessonId, tab>` in the lesson slice) and is not persisted across launches.
- **Nothing ever switches the tab automatically**, except the learner's own actions:
  - "Try it →";
  - clicking a goal (goals are only in Try it anyway);
  - pressing Enter on "Lesson complete" in the bar (4.6).
- Focus on lesson open still goes to the terminal (ruling 1). The live region still announces the title.

### 4.5 Answers to the four explicit questions

**(a) Should Questions live with Goals or with Try it?** **With Try it.** Put them after the steps and before Goals.
- A question is an input, which is a task. A goal is a status, which is a check.
- The steps tell the learner to answer ("Answer the question in the lesson panel", 2.03 step 3), so the card must be one glance from that step.
- Goals stay a scannable checklist. The "Answer: …" goal rows point at the cards and scroll to them.
- A Goals tab holding form inputs would mix two kinds of thing and take them away from the step that asks for them.

**(b) Where should the "Teammate pushes…" buttons go?** **Inline, directly under the step or bullet that names them** (spec in 4.3).
- Keep the button as `secondary` with the Play icon and the "Ran 2×" meta.
- "What does this do?" stays as a quiet meta link on the same line when it fits, wrapping under it otherwise.
- Never after Goals. That is the v0.3.0 bug (7.04).

**(c) Where does "After you finish: what just happened" belong?**
- **Nowhere before completion.** The collapsed `<details>` is a spoiler that adds a line to every lesson.
- **On completion,** it appears under Goals in Try it.
- The bar's "✓ Complete" becomes a link to it, because the bar is where the learner sees the completion.
- It never goes in Read: Read is what you read *before* doing.

**(d) Is the bottom bar still right?** **Yes, with less in it.** With tabs it earns its place: it is the only thing in Read that says how the goals stand, and it carries Prev/Next for both tabs. Changes are in 4.6.

### 4.6 Bottom bar (`BottomBar` in `LessonPanel.tsx`)
- **Layout:**
  - Height 44px, border-top edge, padding 0 8px, chrome size, not scaled.
  - Left: `‹` IconButton 28, tooltip "Previous: <title> (Alt+←)".
  - Centre: status. `flex: 1`, `min-width: 0`, **`flex-shrink: 0` on the status text in the complete state** so it never truncates.
  - Right: Next.
- **In progress:**
  - Status: "2 of 5 goals" (13px fg-2). Drop "· next: <goal>". It is truncated at every width, and in Try it the goal list is visible anyway.
  - Next: ghost "Next →".
- **Goal ticks:** the status shows "✓ <goal label>" in success for 3s (truncate is fine here, the full label is in the live region), then returns to the count. Keep the existing live-region announcement.
- **Complete:**
  - Status: "✓ Complete" (13px, 500, success). This is a **button**: click or Enter selects Try it and scrolls the recap into view (`scrollIntoView({block: "start"})`).
  - Next: primary, `flex: 1` and `max-width: 70%`, label "Next: <title> →", truncated with the full title in the tooltip.
  - At the end of a section, the label is "**Next section: <section title> →**".
  - At 1366 (382px panel) "✓ Complete" takes 92px and Next gets about 230px, which is "Next: Bring fetched work in…". Acceptable; the full title is in the tooltip and the live region.
- **One hook for ticks.** Extract `useGoalTicks()`, which returns `{labels, done, total, complete, justTicked}` and owns the single `prev` ref. `GoalsList` (one-time note) and `BottomBar` (flash, announce) both consume it.

### 4.7 Wireframes: lesson panel

1440x900, panel 403px. Vertical budget:
- top bar 44;
- title block about 74 (one-line title);
- tab strip 36;
- scroll area 702;
- bottom bar 44.

**Read tab, first open (6.08):**

```
┌─────────────────────────────────────────┐
│ Your first conflict                  ◧  │  title 22/600 (lesson-scaled)
│ Easier after 1.05 Ask git what is going │  12 fg-3; "2 more" is a button
│ on and 2 more                           │
├─────────────────────────────────────────┤
│ Read   Try it                  ◇ Hint  │  36px strip; Read selected (2px underline)
├─────────────────────────────────────────┤
│ A three-way merge combines changes from │  15/1.6
│ both sides. When the two sides changed  │
│ the same lines differently, git cannot  │
│ know which version is right. It stops,  │
│ reports a conflict, and asks you to     │
│ decide.                                 │
│                                         │
│ Nothing is committed yet. The merge is  │
│ paused. In the conflicting file, git    │
│ writes both versions between markers:   │
│ ┌─────────────────────────────────────┐ │
│ │ <<<<<<< HEAD                        │ │
│ │ the line as it is on your branch    │ │
│ │ =======                             │ │
│ │ the line as it is on the branch you │ │
│ │ are merging                         │ │
│ │ >>>>>>> new-title                   │ │
│ └─────────────────────────────────────┘ │
│ HEAD labels your side, the branch you   │
│ were on when you ran the merge. …       │
│                                         │
│ [ Try it → ]                            │  secondary, scaled, 24px above
│                                         │
├─────────────────────────────────────────┤
│ ‹        0 of 6 goals            Next → │  44px bar
└─────────────────────────────────────────┘
```

**Try it tab, in progress (7.04):**

```
┌─────────────────────────────────────────┐
│ Fetch                                ◧  │
│ Easier after 5.08 Compare branches by   │
│ commits and 1 more                      │
├─────────────────────────────────────────┤
│ Read   Try it                  ◇ Hint  │  Try it selected
├─────────────────────────────────────────┤
│ 1. Press Teammate pushes two commits in │
│    the lesson panel. Sam's clone        │
│    commits and pushes to origin.        │
│    Nothing changes in your clone yet;   │
│    check the graph.                     │
│    [▷ Teammate pushes two commits]      │  inline action, under step 1
│    Ran 1× · What does this do?          │  meta 12, fg-3
│ 2. Run git fetch. Read what it printed… │
│ 3. Look at the graph. origin/main       │
│    moved; main did not.                 │
│ 4. List the commits that are on         │
│    origin/main but not on main (a       │
│    commit range). Answer the question.  │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ After fetching: how many commits    │ │  question card
│ │ are on origin/main that are not on  │ │
│ │ main?                               │ │
│ │ [ 2      ]   [ Check answer ]       │ │  default-size, scaled
│ └─────────────────────────────────────┘ │
│                                         │
│ Goals                            2 of 5 │
│ ✓ Fetch from origin                     │  14px rows
│ ✓ origin/main now has Sam's two commits │
│ ○ main did not move and the working     │
│   tree is untouched                     │
│ ○ List the incoming commits as a range  │
│ ○ Answer: how many commits came in    ↑ │  click → scrolls to card
│                                         │
│ Stuck, or want a clean start? Reset     │  meta 12
│ lesson                                  │
├─────────────────────────────────────────┤
│ ‹        2 of 5 goals            Next → │
└─────────────────────────────────────────┘
```

**Try it tab, complete (2.03):**

```
├─────────────────────────────────────────┤
│ Read   Try it                           │  Hint button hidden when complete
├─────────────────────────────────────────┤
│ …steps…                                 │
│ ┌ question (green border) ────────────┐ │
│ │ … ✓ Correct.  Change answer         │ │
│ └─────────────────────────────────────┘ │
│ Goals · complete                 3 of 3 │  success colour
│ ✓ Answer the question                   │
│ ✓ Commit todo.txt with "buy bread" in it│
│ ✓ Finish with a clean working tree      │
│                                         │
│ ┃ What just happened                    │  2px success left border; fades in
│ ┃ A commit is made from the staging     │
│ ┃ area, not from the files on disk. …   │
│                                         │
│ Stuck, or want a clean start? Reset …   │
├─────────────────────────────────────────┤
│ ‹ ✓ Complete [ Next: Stage many files →]│  "✓ Complete" is a link to the recap;
└─────────────────────────────────────────┘  Next primary
```

**Boss lesson (7.17), no tabs:**

```
├─────────────────────────────────────────┤
│ Challenge                      ◇ Hint  │  label 13 fg-2, not a tab
├─────────────────────────────────────────┤
│ No steps this time, only goals.         │
│ The club's trail guide lives in …       │
│ • Get your own clone, in a folder …     │
│ • Press Teammate pushes a change: Sam … │
│   [▷ Teammate pushes a change]          │  inline under the bullet
│ • …                                     │
│ Goals                            0 of 7 │
│ ○ …                                     │
```

---

## 5. Owner point 4: the hint button

### 5.1 Placement and behaviour
- **Where:** right end of the tab strip (or of the "Challenge" row in boss lessons). Ghost button, 28px tall, padding 0 8px, `Lightbulb` icon 14px and the label "Hint", 13px weight 500, fg-2. Chrome size.
  - It is reachable from both tabs, always at the same spot, and never scrolls away.
  - The bottom bar was considered and rejected: at 360–400px it already holds three items and truncates.
- **What a press does:** opens the **hint card**, pinned between the tab strip and the tab panel. It does not scroll with content and it does not switch tabs.
  - If no hint has been revealed yet, the first press reveals hint 1.
  - Pressing again while the card is open closes it (toggle, `aria-expanded`).
  - Reopening shows the **last revealed** hint without revealing a new one.
- **One hint at a time.** The card shows a single hint. "Next hint" reveals the following one. Hint 3 is usually close to the answer (2.03: "Stage `todo.txt` once more, then commit it"), so revealing on request, one by one, matters.
- **Paging:** once two or more are revealed, `‹ ›` arrows in the card header page through *revealed* hints only.
- **No penalty, no count shown on the button.** The learner does not need a score. The card says "Hint 2 of 3".
- **Persistence:** `hintsShown` survives tab switches and closing the card. It resets on lesson change and on Reset lesson (as now). Cap it at `hints.length` in the reducer.

### 5.2 Hint card spec (`LessonPanel.tsx`, new `HintCard`; delete `Hints`)
- Container: margin 12px 20px 0, bg sunken, radius 6, padding 10px 12px, `max-height: 35%` of the panel with its own scroll, class `lesson-scale` (the text follows Lesson text).
- Header row (meta 0.8em, fg-3), left to right:
  - "Hint 2 of 3";
  - when more than one is revealed, `‹` and `›` IconButtons 24px with labels "Previous hint" and "Next revealed hint";
  - spacer;
  - ✕ IconButton 24, label "Close hint (Esc)".
- Body: the hint markdown, 0.9333em/1.55, fg, selectable.
- Footer, right-aligned, 8px above:
  - If unrevealed hints remain: ghost scaled button "Next hint" (Lightbulb icon).
  - On the last hint: meta text "That was the last hint." and, after it, the link "Reset lesson" (opens the existing confirm dialog).
- Motion: the slide-down already defined in `lesson.css` (`editor-sheet` keyframes), 160ms. None with reduced motion.
- ARIA:
  - The card is `role="region"` with `aria-label="Hint"`; the button has `aria-controls` pointing at it.
  - When a hint is revealed, focus moves to the card body (`tabIndex={-1}`) and the text is announced via `aria-live="polite"` on the body.
  - Esc in the card closes it and returns focus to the Hint button.
- **Keyboard:** `Alt+H` opens the card if it is closed (revealing hint 1 if none is revealed yet), or reveals the next hint if it is open. When the terminal has focus, Alt+H must *not* steal focus: reveal and announce, but keep focus in the terminal. A learner asking for a hint while typing keeps typing.

### 5.3 Button states

| State | Look | Click |
|---|---|---|
| No hints revealed, card closed | ghost, fg-2, "Hint" | open card, reveal hint 1 |
| Card open | pressed: bg sunken, fg, `aria-expanded="true"` | close card |
| Hints revealed, card closed | ghost, fg-2, "Hint", plus a 6px accent dot top-right of the icon (sr: "Hint, 2 shown") | reopen on last revealed |
| All revealed | as above | reopen; footer says it was the last |
| Lesson complete | **hidden**; the card closes | n/a |
| Lesson has no hints (3 lessons) | **hidden** | n/a |
| Lesson error / loading | hidden | n/a |
| Hover / focus | bg sunken / 2px focus ring | n/a |

### 5.4 Wireframes: hint

In the wireframes, `◇` stands for the Lucide `Lightbulb` icon and `◧` for `PanelLeftClose`.

```
Tab strip, states
│ Read   Try it                  ◇ Hint  │   rest
│ Read   Try it               [◇ Hint]▓  │   card open (pressed)
│ Read   Try it                  ◇•Hint  │   closed, hints revealed (dot)

Card open, hint 2 of 3 revealed
├─────────────────────────────────────────┤
│ Read   Try it               [◇ Hint]   │
│ ┌─────────────────────────────────────┐ │
│ │ Hint 2 of 3            ‹  ›      ✕  │ │  meta 12, fg-3
│ │ Staging copies the file as it is at │ │  14/1.55
│ │ that moment. To stage the newer     │ │
│ │ version, stage the file again.      │ │
│ │                       ◇ Next hint  │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤  tab panel scrolls below, unchanged
│ 1. todo.txt was staged, then edited …   │

Last hint
│ │ Hint 3 of 3            ‹  ›      ✕  │ │
│ │ Stage todo.txt once more, then      │ │
│ │ commit it with a message.           │ │
│ │ That was the last hint. Reset lesson│ │
```

---

## 6. Owner point 1: the settings sheet

### 6.1 Structure
Use a right-side sheet, **440px** wide, fixed px. It narrows to 400px below 1280px wide. The content is a **grouped list**: sentence-case group headings above white cards; inside each card, rows with the label and description on the left and the control on the right, separated by 1px dividers. That is one layout pattern for everything. It is the System Settings / GNOME pattern, which every user has seen.

Groups, in order:
1. **Appearance**: Theme, Reduce motion.
2. **Text size**: Lessons, Terminal and editors.
3. **Graph**: Commit ids, Graph as a text list.
4. **Lessons**: Lesson content (updates), Reset all progress.
5. **Help**: Keyboard shortcuts.
6. Footer (no group): version and credits.

### 6.2 Exact spec (`App.tsx` `SettingsSheet`, `SettingsGroup`, `Row`; new `Switch`, `Segmented`, `Stepper` in `ui.tsx`)
- **Scrim:** `bg-black/15` light, `bg-black/35` dark (from 40/60), so the lesson panel and terminal stay readable while text sizes change live. Keep the focus trap and Esc.
- **Sheet:** `width: 440px`, bg **`bg`** (the app background, not raised), border-left 1px edge-2. The cards sit on it in surface white; in dark, the surface token.
- **Header:** 52px, padding 0 20px, title "Settings" 16px/600, close IconButton 28 (label "Close settings (Esc)"). Border-bottom 1px edge.
- **Body:** scrolls, padding 8px 20px 24px.
- **Group heading:** 13px/600, **fg-2**, sentence case (no caps, no tracking), margin 20px 4px 8px.
- **Card:** bg surface, 1px edge, radius 8, overflow hidden. Rows separated by 1px edge (`divide-y`).
- **Row:** `display: flex; align-items: center; gap: 16px; min-height: 48px; padding: 10px 14px`.
  - Left: label 13.5px/20 (`0.84375rem`, fixed), fg, weight 500, and an optional description 12px/16 fg-3 below it, 2px gap. Text wraps only on the left side.
  - Right: the control, `flex-shrink: 0`, right-aligned.
- **Caption under a card** (optional): 12px fg-3, margin 6px 4px 0.
- **Controls, one per type:**
  - **Segmented** (Theme): 28px tall, 1px edge-2, radius 6, segments padding 0 10px, 13px/500; selected bg ink, fg ink-fg. `role="radiogroup"` with arrow keys. Reuse the graph's repo-switcher styles.
  - **Switch** (all booleans): 32x18 track, 14px knob, off: edge-2 track; on: accent track. `role="switch"`, `aria-checked`, Space toggles. The whole row is clickable.
  - **Stepper** (text sizes): `[−]` IconButton 28, value 40px wide (13px tabular-nums, centred), `[+]` IconButton 28, in a 1px edge-2, radius 6 box.
    - `role="spinbutton"` with `aria-valuenow/min/max`, `aria-valuetext="15 pixels"`, ↑/↓ keys.
    - At min or max the button is disabled.
    - When the value ≠ default, show a ghost "Reset" (12px) to the left of the stepper.
  - **Button** (actions): `secondary`, md.
  - **Navigation row** (Keyboard shortcuts): the whole row is a button, with the shortcut "Ctrl+/" in 12px mono fg-3 and a `ChevronRight` 14 fg-3 on the right.

### 6.3 Rows and copy

| Group | Row label | Description (12px fg-3) | Control |
|---|---|---|---|
| Appearance | Theme | none | Segmented: System · Light · Dark |
| Appearance | Reduce motion | "Canopy already follows your system setting. Turn on to always reduce it." | Switch (`motion = reduce` / `system`) |
| Text size | Lessons | "Lesson text, questions and goals" | Stepper 13–22, default 15 |
| Text size | Terminal and editors | "Terminal, commit messages and files" | Stepper 11–20, default 13 |
| | *caption under the card* | "Ctrl+= and Ctrl+− change the one you are working in." | n/a |
| Graph | Show commit ids | "Instead of commit messages under each commit" | Switch |
| Graph | Graph as a text list | "Easier with a screen reader" | Switch |
| Lessons | Lesson content | "Version 2026.10.03.1 · last checked never. Canopy only goes online when you press Check." | Button "Check" (secondary). While checking: loading. When an update exists: primary "Update". After a check: the description updates. |
| Lessons | Reset all progress | "Marks all 37 completed lessons as not done" (only when > 0; otherwise "Nothing to reset", button disabled) | Button "Reset…" **secondary, neutral**; red only in the confirm dialog (ruling 14) |
| Help | Keyboard shortcuts | none | Navigation row: "Ctrl+/ ›", opens the overlay on top of the sheet |
| Footer | n/a | "Canopy 0.3.0 · git 2.43.0 · lesson format 1" / "Inter and JetBrains Mono (OFL) · Lucide icons (ISC)" in 12px fg-3, centred, 24px above the bottom | n/a |

Removed:
- the APPEARANCE/LESSONS/HELP/ABOUT caps headings;
- the 140px label grid;
- both native selects;
- the bordered "Lesson content" card-inside-a-group;
- the teal link;
- the red reset;
- the "About" group (now a footer).

Do not add the app version string anywhere else (ruling 28).

### 6.4 Wireframe: settings sheet (440px, light)

```
┌──────────────────────────────────────────────┐
│ Settings                                  ✕  │ 52px
├──────────────────────────────────────────────┤
│                                              │
│ Appearance                                   │ 13/600 fg-2
│ ┌──────────────────────────────────────────┐ │
│ │ Theme              [System│Light│ Dark ] │ │ 48px row
│ ├──────────────────────────────────────────┤ │
│ │ Reduce motion                      (  ●) │ │
│ │ Canopy already follows your system       │ │
│ │ setting. Turn on to always reduce it.    │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Text size                                    │
│ ┌──────────────────────────────────────────┐ │
│ │ Lessons                    [ − │ 15 │ + ]│ │
│ │ Lesson text, questions and goals         │ │
│ ├──────────────────────────────────────────┤ │
│ │ Terminal and editors  Reset [ − │ 16 │ + ]│ │ "Reset" only when ≠ default
│ │ Terminal, commit messages and files      │ │
│ └──────────────────────────────────────────┘ │
│  Ctrl+= and Ctrl+− change the one you are    │ caption 12 fg-3
│  working in.                                 │
│                                              │
│ Graph                                        │
│ ┌──────────────────────────────────────────┐ │
│ │ Show commit ids                    (●  ) │ │
│ │ Instead of commit messages under each    │ │
│ │ commit                                   │ │
│ ├──────────────────────────────────────────┤ │
│ │ Graph as a text list               (●  ) │ │
│ │ Easier with a screen reader              │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Lessons                                      │
│ ┌──────────────────────────────────────────┐ │
│ │ Lesson content                 [ Check ] │ │
│ │ Version 2026.10.03.1 · last checked      │ │
│ │ never. Canopy only goes online when you  │ │
│ │ press Check.                             │ │
│ ├──────────────────────────────────────────┤ │
│ │ Reset all progress            [ Reset… ] │ │ secondary, not red
│ │ Marks all 37 completed lessons as not    │ │
│ │ done                                     │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Help                                         │
│ ┌──────────────────────────────────────────┐ │
│ │ Keyboard shortcuts             Ctrl+/  › │ │ whole row is a button
│ └──────────────────────────────────────────┘ │
│                                              │
│   Canopy 0.3.0 · git 2.43.0 · lesson format 1│ 12 fg-3, centred
│   Inter and JetBrains Mono (OFL) · Lucide    │
│                  icons (ISC)                 │
└──────────────────────────────────────────────┘
```

Height check at 768px tall: about 52 + 5 headings × 41 + 9 rows × about 60 + caption and footer about 80 = 880px, so it scrolls a little at 768 and fits at 900. Fine; it is a sheet.

---

## 7. Other things in the lesson panel that are confusing or unjustified

1. **Three "Answer: …" goal rows duplicate three question cards** (6.08 has six goals, half of them answers). When a lesson has two or more `answer` goals, render them as one row: "Answer the questions · 1 of 3". Clicking it scrolls to the first unanswered card, and it ticks when all are correct. Single answer goals stay as written. This is a UI-only change; `goal.json` stays as it is. P2.
2. **The destructive banner** is right where it is (top of Read). Add its first sentence as a 12px warning-coloured meta line at the top of Try it too ("Destructive: Reset lesson brings everything back"). Learners who resume a lesson land on Try it and never see Read. P2.
3. **The collapse icon (`PanelLeftClose`) sits in the title row** next to a two-line title and steals 24px of measure from it. Move it into the tab strip's right end, after Hint, separated by 8px. Then the title gets the full width. P3.
4. **"Ran 2×"** is internal bookkeeping. Keep it only when the content tells the learner to press again (7.06). Otherwise drop it. P3.
5. **"Change answer" after "Correct."** invites undoing a success. Keep it, but make it 12px fg-3 (it is currently an accent link with the same weight as the result). P3.

---

## 8. Prioritised change list

### P1 (do together; they touch the same files)
1. **Text-size model** (section 3).
   - Fixed 16px root.
   - `lessonText` (13–22, default 15) on `.lesson-scale` with em sizes inside.
   - `codeText` (11–20, default 13) for the terminal, editor sheet and file editor.
   - Panel widths in px.
   - Migrate `textSize`.
   - Focus-based `Ctrl+=/−/0` with a pill.
   - Files: `App.tsx`, `theme.ts`, `styles.css`, `lesson.css`, `Workspace.tsx`, `Terminal.tsx`, `CodeEditor.tsx`, `GraphPane.tsx`, `ui.tsx` (`Button scaled`).
2. **Lesson tabs Read / Try it** (4.3, 4.4).
   - Pinned title and strip.
   - Split rules.
   - "Try it →" at the end of Read.
   - Default-tab logic.
   - Full ARIA tabs.
   - No tabs in boss lessons.
3. **Actions inline at the step that names them** (4.5 b). This fixes the 7.04 bug.
4. **Hint button and pinned hint card, one hint at a time** (section 5). Delete the `Hints` section; cap `hintsShown`; Alt+H keeps terminal focus.
5. **"What just happened" only on completion, under Goals; "✓ Complete" in the bar links to it** (4.5 c, 4.6).
6. **Settings sheet redesign** (section 6): grouped list, Segmented, Switch, Stepper, neutral reset, lighter scrim, footer instead of About.

### P2
7. **Bottom bar:**
   - drop "· next: <goal>";
   - "✓ Complete" never truncates;
   - Next takes `flex: 1`;
   - "Next section: <title> →";
   - one `useGoalTicks()` hook.
8. **Visual hierarchy in the panel:**
   - goals at 14px (0.9333em), not 13px;
   - "Check answer" default size;
   - question options at 14px with 2.2em rows.
9. **Collapse several "Answer: …" goals into one row** (7.1).
10. **Destructive meta line at the top of Try it** (7.2).
11. **Content and format fixes:**
    - 4.12: `## The cases` becomes `## Try it`.
    - 12.13 and 13.15: `## Goals` becomes `## Your tasks`.
    - `LESSON_FORMAT.md`: `## Try it` is required except in boss lessons; action labels must appear in bold in the step that uses them.
12. **ARIA tab gaps in `Inspector.tsx`**: arrows, roving tabindex, `aria-controls`.

### P3
13. Collapse icon moves into the tab strip (7.3); drop "Ran N×" (7.4); quieter "Change answer" (7.5).
14. The graph Key popover auto-opens after the first command and does not cover new commits (2.5).
15. Optional "Interface zoom" through webview zoom, only if testers with low vision ask (3.1).

---

## 9. What I could not verify
- **Lesson text at 20–22px.** There is no URL parameter for it in the preview. The em scale and the measure figures are computed, not captured. Check 6.08 at 22px in the real app after P1.1.
- **The completion "Next" button style.** It rendered ink in the 2.03 capture but sunken or plain in 6.08, 7.04 and 7.17, where the graph Key popover had auto-opened. This is probably a headless transition artifact. Confirm in the app that the button is primary on completion.
- **Whether learners return to Read during Try it.** I assumed it from the content (flag tables, marker diagrams). If observation shows they never do, B still costs nothing, because the tab is one click.
