# Canopy UX review

Independent usability review, 2026-10-03. Reviewer saw the app for the first time, through the browser preview (`http://localhost:1420`) and the UI source. Screenshots are in `/tmp/claude-1000/ux/`. Preview artifacts (the replayed transcript, `[cmd -> exit 0]` lines, the finished lesson state, empty Files/Changes/Areas data, and the bottom ~87px of each headless screenshot rendering blank) are ignored. The real first-open state was worked out from the code.

## Overall verdict

**Intuitiveness: 6.5 / 10.** The basics are good. The visual language is calm and consistent, the colours are restrained, there is no gamification noise, and wrong answers and goal changes are handled kindly ("Not quite. Try again.", goals never turn red). Home has a single obvious "Start" button, and the first lesson hides the graph, which is the right kind of progressive disclosure. The problems come from density and duplication. A total beginner meets about 20 controls, three uppercase pane headers and four regions. Nothing on screen says "click here and type", and the terminal does not have focus. The lesson panel holds the instructions, yet it is the most cramped region: the "Try it" steps and the question sit below the fold even at 1440x900, and the goals footer and completion card squeeze it further. The graph is drawn well, but it labels nodes with hex ids instead of what a beginner can read (commit messages). Nothing explains the HEAD ring, the colours or the dashed and grey commits, and clicking a node does nothing useful. The completion moment shows the same "next" choice four times. Most fixes are removals, so the app could reach 8.5 without adding features.

## Findings

Severity counts: **critical 2 · major 9 · minor 14 · polish 6** (31 total).

### 1. Critical: Lesson workspace, terminal. Nothing tells a beginner where to type, and the terminal is not focused
- **Problem:** When a lesson opens, focus goes to the lesson title (`LessonPanel.tsx` focuses `titleRef`). The terminal shows an unfocused prompt (`1.01 $`) with a hollow cursor. Lesson 1.01 says "Type a command and press Enter" but never says *where*. The only on-screen help is "Tab completes commands here. Press Alt+1–4 or F6 to move to another pane", which is about leaving the terminal, not entering it. Learners who have never used a terminal (the 1.x audience) will type into nothing, or wait.
- **Who:** Section 1 learners, who are exactly the target of "from total beginners".
- **Evidence:** `lesson101.png`, `lesson101-tall.png`; DESIGN.md 10.2 makes "no autofocus" a deliberate choice.
- **Recommendation:** Focus the terminal when a lesson opens. Screen readers can still start at the title through `aria-describedby` or an `aria-live` announcement, or keep title focus only when a screen reader or keyboard-only use is detected. If autofocus stays off, replace the current hint row with one line inside the empty terminal, such as "Click here and type a command", which disappears on first focus. Remove the "Tab completes…/F6" sentence from the default view (see 10).

### 2. Critical: Lesson panel. The instructions are below the fold, and the panel shrinks further as you progress
- **Problem:** In the lesson panel, the content scroll area gets about 440px at 1440x900 and about 200–300px at 1100x700. The goals footer (up to 40%), the completion card, the Reset/Next row and a 36px "LESSON" header take the rest. In 1.01 the "Try it" steps, the question the goals ask for ("Name the hidden file") and the hints are all below the fold. A learner sees the theory paragraph and the goals but not the steps. On completion the card covers part of the goal list (the 4th goal of 1.01 is cut off mid-line).
- **Who:** Everyone, and worst at small windows.
- **Evidence:** `lesson101.png` (Try it not visible), `lesson101-tall.png` (Try it only appears at 1100px tall), `lesson101-small.png` (one goal visible), `lesson717-small.png`, `lesson513.png` (the card overlaps the 4th goal).
- **Recommendation:** Give the reading area priority:
  - Drop the "LESSON" pane header (move the collapse chevron into the lesson header row).
  - Cap the goals footer lower, or collapse it to a one-line "Goals 2/5 ▾" when the panel is short.
  - Put the completion message into the existing goals band instead of adding a card (see 3).
  - Consider letting "Try it" steps *be* the goals (they mostly duplicate each other) so the learner reads one list, not two.

### 3. Major: Completion moment. The same "go next" choice appears four times
- **Problem:** When a lesson completes, the learner sees:
  - a green "Lesson complete." band with a 5/5 chip;
  - a card that says "Done. Next: 1.02 Make and view files." with "Stay here" and "Next lesson" buttons;
  - a primary "Next >" button right below it;
  - the top-bar "1.02 >".

  That is three adjacent next buttons and two "done" messages. "Stay here" is a non-action, because staying is the default.
- **Who:** All learners. It makes the calm moment feel cluttered.
- **Evidence:** `lesson101.png`, `lesson513.png`, `lesson717.png`.
- **Recommendation:** Remove the card. On completion, turn the goals band into "Lesson complete" and the footer button into a primary "Next: Make and view files →" (the title, not just "Next"). When it is the last lesson in a section, use "Next section: Merging →". Drop "Stay here".

### 4. Major: Graph. Unreadable for someone who has never seen a commit graph
- **Problem:**
  - Every node carries a 7-char hex id. That is the most prominent text in the graph and means nothing to a beginner.
  - Commit messages, which are what a beginner recognizes ("Add shopping list"), only appear in a native hover tooltip.
  - Nothing explains the HEAD ring vs the "HEAD" word floating above the branch pill, the per-branch colours, merge rings, the dashed or grey commits, or that time runs left to right.
  - Clicking a node selects it (draws a ring) and shows nothing, which is a dead end that suggests something should happen.
  - "HEAD" is shown from lesson 1.03 onwards, but it is taught in 3.07.
- **Who:** Sections 1–5 learners.
- **Evidence:** `lesson203.png` (two nodes with ids, HEAD before it is taught), `lesson513.png`, `lesson608.png`.
- **Recommendation:**
  - Default to showing the commit subject (truncated) under each node instead of the id, and show the id on hover or selection. Keep the "Show commit ids" setting for advanced users, or switch ids on automatically from the section that teaches hashes.
  - Make click show a small detail popover: subject, short id, author, "Copy id".
  - Add a one-line, dismissible key under the graph the first time it appears ("● commit · ◎ where you are (HEAD) · pill = branch · time →").

### 5. Major: Graph. Rewritten and unreachable history is drawn but never named
- **Problem:** In 9.16, the pre-rebase commits form a full grey row above main, and dashed "copy" arrows cross the whole graph and run over the id labels ("b45f598", "687fcc3"). Nothing says "these are the old commits, no branch points to them any more". A dashed ghost node (`beec807`) floats over the HEAD area. The picture is the lesson's main point, but it reads as noise.
- **Who:** Section 9–10 learners.
- **Evidence:** `lesson916.png`, `lesson916-linear.png`.
- **Recommendation:** Label the grey row once ("old commits, not on any branch"). Draw copy arrows only on hover or selection of a rewritten commit, or keep only the most recent ones. Keep arrows from crossing text by routing them below the lane.

### 6. Major: Top bar and footer. Navigation and progress are duplicated
- **Problem:** Prev/next appear in the top bar (as bare ids like "5.12" and "5.14", meaningless without titles) and again as "Next" in the goals footer. Overall progress appears as a "60 / 225" chip in the top bar on every screen and again as "Overall progress 60 of 225 · 27%" on Home. Inside a lesson, the global "1 / 225" counter is unrelated to the task at hand.
- **Who:** All learners. These are extra things to read and parse.
- **Evidence:** `lesson513.png`, `home-progress.png`.
- **Recommendation:** Remove top-bar prev/next (keep Alt+←/→ shortcuts and the footer button). Remove the top-bar progress chip, or show it only on Home in place of the separate "Overall progress" heading. The breadcrumb already gives the location.

### 7. Major: Lesson 1.01 and the Files tab. The content promises behaviour the UI does not have
- **Problem:** 1.01 says "The files panel follows you as you move". The Files tree always lists the lesson root and never expands or highlights the terminal's current folder (`Inspector.tsx` `Tree path=""`; `list_dir` has no cwd awareness). The tree also lists dot-files, so the "hidden" `.ideas.txt` that the question asks the learner to find with `ls -a` is visible when `notes` is expanded. That spoils the point of the exercise.
- **Who:** 1.x learners, in the very first lesson.
- **Evidence:** `lesson101.png`; `lessons/1.01/content.md`; `src-tauri/src/commands.rs` `list_dir`.
- **Recommendation:** Either make the tree follow the cwd (auto-expand to and highlight the current folder) or change the sentence. Hide dot-files in the tree (except `.git`, shown dimmed) unless a toggle is on, at least for Section 1.

### 8. Major: Graph pane header. Icon-only controls with unclear meaning
- **Problem:** The graph header can show an eye icon ("Follow terminal"), a list icon ("Graph as text"), a columns icon ("Show origin side by side"), a collapse chevron, a three-segment repo switcher with a tiny terminal glyph on one segment, and an operation chip. A beginner cannot guess what the eye or columns icons do, and "Follow terminal" is a mode with hidden state: clicking a repo segment silently turns it off.
- **Who:** Section 7+ learners (multi-repo lessons) and anyone curious about the icons.
- **Evidence:** `lesson717.png`, `lesson717-small.png`.
- **Recommendation:**
  - Remove the eye toggle. Clicking a segment pins it, and a small "Back to terminal's repo" link appears only while pinned.
  - Move "Graph as text" into the Settings or accessibility menu (screen readers already get the `aria-label` summary).
  - Keep "side by side" but give it a text label ("Compare with origin").
  - Write the terminal glyph on the segment as a word ("you are here") or drop it.

### 9. Major: Across the workspace. Jargon shown before it is taught
- **Problem:**
  - "Teaches `term-navigate`", "`rebase-i-squash`" and "`conflict-read`" are raw internal skill ids, deliberately not humanized (DESIGN.md 4.2).
  - The Changes tab dropdown "Working tree vs staging / Staging vs HEAD / Working tree vs HEAD" appears in every repo lesson from 1.03, before staging is taught (2.x).
  - The tab name "Areas" means nothing until 2.03.
  - The file-tree status letters `? A M !` are unexplained.
  - "pane", "Tab completes commands" and "destructive lesson" appear in the terminal chrome.
  - Kind labels "PRACTICE / CONCEPT / BOSS" (and "Guided") have no explanation.
- **Who:** Sections 1–3 learners.
- **Evidence:** `lesson101.png`, `lesson203.png`, `lesson608.png`, `section5.png`.
- **Recommendation:**
  - Remove the "Teaches" row entirely: the title already says what the lesson teaches.
  - Show the Changes tab only when the lesson lists `diff`, as the spec says (code currently forces it in `Workspace.tsx` line 121), and label its scopes in plain words once taught.
  - Give status letters a `title` tooltip ("M = modified since last commit").
  - Drop the kind label in the lesson header, or keep only "Boss" as "Challenge".

### 10. Major: Terminal pane header. Clutter and one control that does nothing
- **Problem:** The header shows "TERMINAL ." (the "." means "lesson root", which is cryptic), a "−" button, a "+" button (font size, duplicating Settings and Ctrl+=/−), "Clear", and a keyboard icon that looks like a button but has no action (tooltip only). Below it, a full-width hint row repeats the keyboard icon's text, and the spec says it should appear only on first focus but it shows on load (`Workspace.tsx` `termHint`).
- **Who:** All learners.
- **Evidence:** `lesson101.png`, `lesson513.png`.
- **Recommendation:**
  - Remove −/+ (Settings and shortcuts cover them) and the keyboard icon.
  - Show the cwd only when it is not the root, or as "in: notes".
  - Keep "Clear" (it is self-explanatory).
  - Show the leave-the-terminal hint once, on first focus, as the spec says.

### 11. Major: Terminal. The "You left the learning folder" banner has no way back
- **Problem:** The warning says the graph and goals will not update "until you go back", but it does not say how. The spec's [Go back] action is not implemented. A beginner who typed `cd ..` once too often is stuck, with everything silently frozen.
- **Who:** Section 1–2 learners.
- **Evidence:** `Workspace.tsx` lines 211–215 vs DESIGN.md 4.5.
- **Recommendation:** Add the [Go back] button (paste `cd <root>` into an empty prompt), or at least print the exact command to type in the banner.

### 12. Minor: Lesson panel. The recommended-first notice is the loudest thing on screen
- **Problem:** It is a full teal-filled banner with a title, a list and a close button, placed above the content. It is the most saturated element in the workspace. "+3 more" is plain text, not clickable (the spec says popover). It did not appear for linear learners (`lesson513-linear.png`, `lesson916-linear.png`), which is good.
- **Evidence:** `lesson513.png`, `lesson203.png`, `lesson608.png`.
- **Recommendation:** Make it one neutral line ("Easier after: 3.07 What is HEAD and 2 more") with links, no fill and no title.

### 13. Minor: Destructive flag. Stated three times
- **Problem:** An orange "Destructive" chip in the section list, a warning banner in the lesson, and a "destructive lesson" chip in the terminal header. The section-list chip may scare beginners off important lessons (5.06 checkout, 5.11 delete a branch).
- **Evidence:** `section5.png`; `Workspace.tsx` line 189.
- **Recommendation:** Keep only the in-lesson banner (its copy is good and calm). Remove the terminal chip and the list chip.

### 14. Minor: Goals footer. "Reset lesson" is red and always visible
- **Problem:** A red text button sits at the same height as Next at all times. Red draws the eye on every lesson even though reset is rarely needed. It is safe (there is a confirm dialog), but it is visual noise.
- **Evidence:** all lesson screenshots.
- **Recommendation:** Make it a neutral ghost "Start over" (or an icon with a label in a small overflow menu). Keep the red only in the confirm dialog.

### 15. Minor: Goals. The sticky-goal pin icon has no meaning and no tooltip
- **Problem:** A small pin appears next to some passed goals. Its explanation is in `aria-label` only, so a mouse user gets no tooltip. A beginner does not need to know a goal is "sticky".
- **Evidence:** `lesson513.png`, `lesson608.png`.
- **Recommendation:** Remove the pin.

### 16. Minor: Pane headers. Uppercase labels that cost space and add little
- **Problem:** "LESSON", "GRAPH" and "TERMINAL" headers take 36px each. The lesson one holds only a chevron. The regions are visually obvious without names.
- **Evidence:** all lesson screenshots.
- **Recommendation:** Remove the lesson pane header, and keep the graph and terminal headers only where they hold controls.

### 17. Minor: Chevron overload
- **Problem:** Several chevrons mean different things:
  - `<` collapses the lesson pane;
  - `< 5.12` / `5.14 >` navigate between lessons;
  - `>` collapses the inspector;
  - `^` collapses the graph;
  - `>` in the breadcrumb is a separator;
  - `>` on "Next" moves to the next lesson.

  A beginner cannot tell collapse from navigation.
- **Evidence:** `lesson513.png`.
- **Recommendation:** Use panel icons (`panel-left-close`, `panel-right-close`) for collapse. With 6 applied, the top-bar chevrons go away.

### 18. Minor: Inspector. Tabs that are present but empty, and an unexplained default
- **Problem:**
  - Changes is always present for repo lessons, and Areas or .git appear per lesson, so the tab set changes from lesson to lesson without a reason the learner can see.
  - The default tab is the first listed panel, so 6.08 opens on Changes, which shows "Nothing has changed" during a conflict (may be a preview limitation).
  - In 1.01 the only tab is "Files", which reads as a heading, not a tab.
- **Evidence:** `lesson608.png`, `lesson203.png`, `lesson101.png`.
- **Recommendation:** Keep tab order fixed and only add tabs. If a lesson wants Areas or Changes visible, open it, but give the empty state a sentence that ties it to the task ("Run `git diff` or edit a file; changes appear here").

### 19. Minor: Home. Contradictory and over-signalled current section
- **Problem:** The current card says "Continue · Not started". It also has a teal left border, a teal dot and a progress bar. That is four cues for one fact, and two of them contradict each other. A fresh learner also sees a "0 of 225 · 0%" progress bar first, which reads as discouraging. The level names "Beginner, Core, Intermediate, Advanced" are an odd ordering (is Core easier than Intermediate?).
- **Evidence:** `home.png`, `home-progress.png`.
- **Recommendation:** Drop the "Continue ·" prefix and the dot (the Start/Continue card above already says it). Hide the overall bar until at least one lesson is done. Consider renaming "Core" to "Everyday".

### 20. Minor: Section view. A kind chip on every row, and "Reset progress" at eye level
- **Problem:** Every row ends with "Practice" or "Concept", which is repetitive and has no meaning for the learner. A red "Reset progress" sits next to the progress bar on a browsing screen.
- **Evidence:** `section5.png`, `section1.png`.
- **Recommendation:** Remove kind chips except "Boss" (or "Challenge"). Move section reset to Settings → Progress, or into a small overflow menu.

### 21. Minor: Goals are not connected to where you act
- **Problem:** "Answer the question" is a goal, but the question card is far below in the scrolling content. Clicking the goal does nothing.
- **Evidence:** `lesson203.png`, `lesson101-tall.png`.
- **Recommendation:** Make question goals clickable to scroll to and focus the question. Or place question cards right after "Try it", which is where they are, but then fix 2 so that spot is visible.

### 22. Minor: Events box. "Events" and "View script" are internal concepts
- **Problem:** The 7.17 content says "Press **Teammate pushes a change**". The button sits in a box titled "Events", with a "{} View script" button next to it that shows a shell script. Beginners do not need the script, and "Events" is not a word the content uses.
- **Evidence:** `LessonPanel.tsx` lines 79–96, content of 7.17.
- **Recommendation:** Drop the "Events" heading (the button label is enough). Move "View script" to a small link shown only from Section 12+, or into the button's tooltip.

### 23. Minor: Small window. The breakpoints leave the centre cramped
- **Problem:** At exactly 1100x700 the inspector stays open (`winW < 1100` collapses it), so the terminal gets about 540px, the lesson panel 300px and the graph about 230px. Everything is visible, but nothing is comfortable. See also 2.
- **Evidence:** `lesson101-small.png`, `lesson717-small.png`.
- **Recommendation:** Collapse the inspector by default below about 1280px wide (it is the least essential region). Open it automatically when a lesson needs Areas or .git.

### 24. Minor: Keyboard shortcuts overlay has no visible entry point
- **Problem:** Ctrl+/ opens a good shortcuts list, but nothing in the UI mentions it, and Settings does not link to it.
- **Evidence:** `App.tsx` `Shortcuts`; `settings.png`.
- **Recommendation:** Add a "Keyboard shortcuts" row in Settings.

### 25. Minor: Graph label collisions
- **Problem:** In 7.17 a branch edge runs through the id "9141639". The "HEAD" word sits at the top of a three-flag stack (v1.1, origin/main, main), far from the ringed node it refers to. In 9.16 copy arrows overprint ids.
- **Evidence:** `lesson717.png`, `lesson717-small.png`, `lesson916-linear.png`.
- **Recommendation:** Put HEAD next to the pill it points through ("HEAD → main" as one flag), or put it directly on the ring. Offset ids on lanes with a curve passing.

### 26. Polish: First run. An info box that looks like a setting, and a theme choice nobody needs yet
- **Problem:** "Learning folder" is shown as a card next to the interactive "Appearance" card, so it looks like an option. It also does not say *where* the folder is. The theme choice is extra friction before the first lesson ("Follow system" is already right for nearly everyone).
- **Evidence:** `firstrun.png`.
- **Recommendation:** Make the learning-folder text a single sentence, including the path. Drop the Appearance card (Settings has it). The screen becomes the title, a sentence, "git found", and one button.

### 27. Polish: Lesson header metadata
- **Problem:** "1.01 · PRACTICE", plus a Guided chip, plus the Teaches row (see 9). The id is already in the breadcrumb.
- **Evidence:** `lesson101.png`.
- **Recommendation:** Keep only the title (with the id in the breadcrumb).

### 28. Polish: Home footer version string
- **Problem:** "Lessons 2026.10.03.1 · Check for updates" is maintenance info on the learner's main screen.
- **Evidence:** `home.png` (below the fold).
- **Recommendation:** Keep it in Settings only, and show a footer line only when an update is actually available.

### 29. Polish: Two "done" words
- **Problem:** "Lesson complete." and "Done." both appear, and goal announcements say "Goal done". See 3.
- **Recommendation:** Use one phrase consistently.

### 30. Polish: Many 11px uppercase grey labels
- **Problem:** Several small grey caps labels (pane headers, GOALS, START HERE, NEXT UP, BEGINNER…, EVENTS, settings group titles, section eyebrow) create a busy "dashboard" texture. They pass contrast (4.5–4.8:1) but sit at the floor.
- **Recommendation:** Remove the ones that only name an obvious region (pane names, "Start here", "Events"). Keep group headings.

### 31. Polish: Editor sheet hidden in graphless lessons
- **Problem:** The git editor sheet renders inside the graph container only when the graph is shown (`Workspace.tsx` lines 171–176). Lessons with `repo: null` would have nowhere to show it. This is probably never triggered, but it is fragile.
- **Recommendation:** Render the sheet over the centre column regardless of `showGraph`.

## Questions and doubts

1. **Terminal autofocus vs screen readers (1).** The spec deliberately does not autofocus the terminal. I want to know how many first-time learners in a 5-person hallway test click the terminal before typing. If most do it unprompted, a light "click here" cue is enough. If not, autofocus.
2. **Should "What just happened" be visible before the learner does the task?** It is rendered from the start (after questions and hints) and can explain the outcome before the learner has tried. I want to know whether the content is written as a recap (it reads that way) and whether learners scroll down and read it first.
3. **Are "Try it" steps and Goals redundant by design?** In 1.01 they are near-identical lists. I want to know whether the authors intend goals to be checks (terse) and steps to be instructions (verbose). If so, showing both is fine, but only one should be in the reading path.
4. **Do commit ids need to be on by default?** Commit questions accept a clicked node and refs like `HEAD~2`, so ids might not be needed early. I want to know which sections first ask the learner to type a hash.
5. **Is the four-region layout right from lesson 1.03?** The graph disappears for `repo: null`, which is good. I could not tell whether the inspector earns its place in sections 1–2, or whether it should start collapsed and open when a lesson asks. I want click data or observation of whether learners use Files and Areas unprompted.
6. **Goal checking cadence.** Goals re-check after each command, save and answer, with no visible "checking…" state. I want to know whether learners understand that goals tick automatically, or whether they look for a "Check" button (the questions *do* have one, which may set that expectation).
7. **Changes and Areas data was empty in preview.** I could not judge the real diff and three-area visuals, which may be better than the empty states suggest. They should be re-reviewed in the real app with a modified, staged file.
8. **Home bottom rows and footer.** The headless screenshots cut the last ~87px. I assumed the "Advanced" cards and the footer render normally in the app.
9. **Multi-repo "Follow terminal".** I want to know how often a learner pins a repo deliberately. If rarely, the eye toggle can go (8).
10. **Alt-chords inside the shell.** Alt+H, Alt+G, Alt+[ and Alt+] are captured by the app even in the terminal. Bash readline has no default bindings on these, but a learner editing in `nano` or `vim` from the terminal might. Does any lesson open a terminal editor (not the in-app sheet), and did anyone hit a conflict?
11. **Light vs dark default.** Headless Chrome rendered "system" as dark. I want to know which theme most learners end up in. The light theme looked equally clean (`lesson513-light.png`, `lesson101-tall.png`).

## Screenshot index (`/tmp/claude-1000/ux/`)

firstrun, firstrun-dark, home, home-dark, home-light, home-progress, home-small, section1, section5, settings, lesson101, lesson101-dark, lesson101-small, lesson101-tall, lesson203, lesson513, lesson513-light, lesson513-linear, lesson608, lesson608-dark, lesson608-light, lesson717, lesson717-small, lesson916, lesson916-linear (all `.png`).
