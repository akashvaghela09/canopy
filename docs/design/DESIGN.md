# Canopy Design Specification

Status: v1.0, design lead hand-off. Pairs with `prototype.html` in this folder (visual reference for the home screen and lesson workspace in both themes). Product constraints come from `docs/ARCHITECTURE.md` (sections 1, 4.7, 4.8, 5, 9) and `docs/LESSON_FORMAT.md`; nothing here overrides them.

Contents

1. Design principles
2. Information architecture and navigation
3. Screens
4. Lesson workspace
5. Design tokens (Tailwind v4 `@theme`)
6. Typography, spacing, radii, icons
7. Components
8. Graph visual spec
9. Motion
10. Accessibility
11. Microcopy
12. Implementation status
13. Open design questions

---

## 1. Design principles

1. **The repo is the hero.** Terminal, graph and files take the space; the app chrome is thin, neutral and quiet. Nothing in the UI competes with a commit appearing on the graph.
2. **Calm, not gamified.** No confetti, streaks, badges or scores. The reward for finishing a lesson is a clear checkmark and the next step. Celebration is one short, honest sentence.
3. **One idea in view.** The lesson panel reads top to bottom in under two minutes. Goals are always visible; everything optional (hints, scripts, questions already answered) is folded.
4. **Shape before color.** Every meaning on the graph has a non-color signal: HEAD is a ring, tags are a different shape, remotes are outlined, rewritten commits are dashed. Color confirms; it never carries the message alone.
5. **Nothing is hidden.** Teammate scripts are readable, destructive lessons say what is lost, and Reset lesson is always one click away. The app never pretends to be a sandbox.
6. **Cheap pixels.** Flat fills, 1px borders, no blur, no shadows on the canvas, transform/opacity animation only. WebKitGTK must stay at 60 fps with a 60-commit graph.
7. **Keyboard-complete.** Every action reachable from the terminal without the mouse; the terminal never traps the user.

---

## 2. Information architecture and navigation

```
Startup
  └─ Git gate (blocking)  ──ok──▶  First run (once)  ──▶  Home
                                                           ├─ Section view (15)
                                                           │     └─ Lesson workspace (225)
                                                           │           ├─ prev / next lesson (same section, then next section)
                                                           │           └─ Reset lesson (dialog)
                                                           ├─ Settings (sheet over any screen)
                                                           │     ├─ Appearance
                                                           │     ├─ Terminal and editor
                                                           │     ├─ Lessons  (reset progress, content updates)
                                                           │     └─ About   (version, licenses, folders)
                                                           └─ Keyboard shortcuts (Ctrl+/ overlay)
```

**Navigation model**

- A single persistent **top bar** (44px) on every screen except the git gate: `[Canopy wordmark/home] › [Section] › [Lesson]` breadcrumbs on the left; right side holds the overall progress chip (`128 / 225`), the content-update dot (only after a manual check found one), and the Settings gear.
- The top bar is the only global navigation. There is no sidebar. Learners move Home → Section → Lesson and back via breadcrumbs or `Alt+Home`.
- **Settings is a right-side sheet** (480px wide, over a scrim) rather than a page, so the lesson behind stays alive (the shell keeps running). `Ctrl+,` opens it anywhere; `Esc` closes it.
- Lesson-to-lesson movement uses `Alt+←` / `Alt+→` and the prev/next buttons in the workspace. Next from the last lesson of a section goes to the first lesson of the next section (by id), with the recommended-first notice if applicable.
- All navigation is non-blocking (no locks). Prerequisite gaps produce only the soft "Recommended first" notice (section 7.5).
- Back behavior: breadcrumbs only, no browser-style history. Leaving a lesson keeps its repo on disk; returning resumes it (shell restarts in the same folder). The repo is rebuilt only by Reset lesson or when the lesson is opened for the first time.

---

## 3. Screens

### 3.1 Git gate (blocking)

Shown when `git --version` fails or is below the minimum (from the version table in `LESSONS.md`). Full window, centered column 440px wide, no top bar.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                     [ branch icon 32px ]                     │
│                 Canopy needs git to run                      │
│   Canopy teaches git by running the real thing, and it       │
│   could not find git on this computer.                       │
│                                                              │
│   ┌────────────────────────────────────────────────────┐     │
│   │  Looked for: git on PATH                           │     │  (mono, fg2)
│   │  Found: nothing                                    │     │
│   └────────────────────────────────────────────────────┘     │
│                                                              │
│   [ Get git from git-scm.com ↗ ]      [ Check again ]        │
│                                                              │
│   Having trouble?  Open the log folder                       │  (link, fg3)
└──────────────────────────────────────────────────────────────┘
```

Variants:
- **Too old:** heading "Canopy needs a newer git"; detail box `Found: git 2.17.1 at /usr/bin/git` / `Needs: 2.32 or newer`. Same buttons.
- **Checking:** the "Check again" button shows a spinner and reads "Checking…" for the duration (min 400ms so it visibly happened).
- **Still missing after a check:** the detail box updates, and a one-line fg2 note appears: "Still not found. If you installed git just now, restart Canopy so it sees the new PATH."

### 3.2 First run (once)

A single screen after the gate passes on first launch. No multi-step wizard.

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│    Welcome to Canopy                                                   │
│    Learn git by using it. Every command you type runs in real git,     │
│    inside a learning folder that Canopy creates for you.               │
│                                                                        │
│    ┌────────────────────────┐  ┌────────────────────────┐              │
│    │ Learning folder        │  │ Appearance             │              │
│    │ ~/.local/share/canopy/ │  │ (●) Follow system      │              │
│    │ lessons                │  │ ( ) Light  ( ) Dark    │              │
│    │ Your own projects are  │  │                        │              │
│    │ never touched.         │  │                        │              │
│    └────────────────────────┘  └────────────────────────┘              │
│                                                                        │
│    git 2.43.0 found at /usr/bin/git                       ✓            │
│                                                                        │
│    [ Start with lesson 1.01 ]        Browse all sections               │
└────────────────────────────────────────────────────────────────────────┘
```

Both cards are informational except the theme radio. "Start" opens lesson 1.01; "Browse" opens Home. The screen never shows again (settings flag), but its content lives in Settings → About.

### 3.3 Home

Purpose: show where you are, get you back into the next lesson in one click, and let you jump anywhere.

```
┌ top bar ───────────────────────────────────────────────────────────────────────┐
│ ⌂ Canopy                                              128 / 225   ⚙            │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  Overall progress                                            128 of 225 · 57%  │
│  ████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  4px track
│                                                                                │
│  ┌ Continue ──────────────────────────────────────────────────────────────┐   │
│  │ Section 6 · Merging                                  7 of 17 complete   │   │
│  │ Next up                                                                 │   │
│  │ 6.08  Your first conflict                             [ Continue → ]    │   │
│  │ Trigger a conflict and read both sides of the markers.                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                │
│  BEGINNER                                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │ 1 Orientation│ │ 2 Core loop  │ │ 3 Looking…   │ │ 4 Basic undo │           │
│  │ ✓ Complete   │ │ ✓ Complete   │ │ ✓ Complete   │ │ ✓ Complete   │           │
│  │ ████████████ │ │ ████████████ │ │ ████████████ │ │ ████████████ │           │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘           │
│  CORE                                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │ 5 Branching  │ │ 6 Merging  ● │ │ 7 Remotes    │ │ 8 Stash…     │           │
│  │ 17 of 17     │ │ 7 of 17      │ │ 0 of 17      │ │ 0 of 10      │           │
│  │ ████████████ │ │ █████░░░░░░░ │ │ ░░░░░░░░░░░░ │ │ ░░░░░░░░░░░░ │           │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘           │
│  INTERMEDIATE … ADVANCED …                                                     │
│                                                                                │
│  Lessons 2026.10.03.1 · Check for updates                 (footer, fg3, 12px)  │
└────────────────────────────────────────────────────────────────────────────────┘
```

Rules:
- Content column max 1040px, centered, 32px side padding. Cards in a 4-column grid (min card 220px); drops to 3 columns under 1000px content width.
- **Continue card** logic: *current section* = section of the *next lesson*; *next lesson* = lowest-id incomplete lesson with id greater than the most recently completed lesson, else the lowest-id incomplete lesson overall. When all 225 are complete the card reads "All 225 lessons complete." with a "Browse sections" button and no progress bar.
- A brand-new user sees the Continue card pointing at 1.01 with the label "Start here" instead of "Next up".
- Section cards: number, title, state line, 4px bar. The current section's card has a 2px accent left border and a small dot after its title (also conveyed by the state line, so not color-only).
- Footer shows the installed lesson content version and a link to the Content updates section in Settings. If a manual check found an update that is not yet installed, the footer reads "Lesson update 2026.11.02.1 available · Install".

### 3.4 Section view

```
┌ top bar ───────────────────────────────────────────────────────────────────────┐
│ ⌂ Canopy › 6 Merging                                   128 / 225   ⚙           │
├────────────────────────────────────────────────────────────────────────────────┤
│  CORE · SECTION 6                                                              │
│  Merging                                                                       │
│  Fast-forward and three-way merges, squash merges and conflicts.               │
│  7 of 17 · 41%   █████████░░░░░░░░░░░░░░░░░░░░░░░░░░            [ Reset progress ]  │
│                                                                                │
│  ✓  6.01  Merge, fast-forward                                   Practice       │
│  ✓  6.02  Three-way merge                                       Practice       │
│  ✓  6.03  Merge commit messages                                 Practice       │
│  ✓  6.04  Force a merge commit                                  Practice       │
│  ✓  6.05  Refuse non-trivial merges                             Practice       │
│  ✓  6.06  Squash merge                                          Practice       │
│  ✓  6.07  Read merges in history                                Practice       │
│  ○  6.08  Your first conflict                        Next       Concept        │  ← row highlighted (sunken bg)
│  ○  6.09  Resolve a conflict                                    Practice       │
│  ○  6.10  Abort a merge                                         Practice       │
│  ○  6.13  See the common ancestor in conflicts      needs git 2.35   Practice  │
│  …                                                                             │
│  ○  6.17  Boss: integrate three features                        Boss           │
└────────────────────────────────────────────────────────────────────────────────┘
```

Rules:
- Rows are 40px tall, full width of the 880px content column, entire row clickable, keyboard navigable (↑/↓, Enter).
- Left glyph: `✓` (success color, filled circle) complete; `○` (border2, hollow) not started; `◐` skipped-with-tool-missing (see 7.5). There is no "in progress" state for a lesson: a lesson is either complete or not.
- Right side: kind chip (Practice / Concept / Boss), optional flags as text chips: "Destructive" (warning outline), "Guided", "Optional", "Needs git 2.35" (warning outline, shown only when the installed git is below `minGit`).
- "Next" tag (accent text) marks the next lesson per the Home rule.
- Rows whose `requires` are not all taught by completed lessons show nothing extra in the list (keeps it calm). The notice appears inside the lesson workspace (section 4.3).
- Reset progress (section scope) is a danger-ghost button; it opens the confirm dialog in 11.4.

### 3.5 Lesson workspace

See section 4.

### 3.6 Settings (sheet)

480px right-side sheet, scrim 40% black (light) / 60% black (dark), no blur. Sections as a single scroll with sticky section labels; a 4-tab strip at the top jumps between them.

```
┌ Settings ──────────────────────────────────── ✕ ┐
│ Appearance   Terminal   Lessons   About          │  (tabs, underline style)
├──────────────────────────────────────────────────┤
│ APPEARANCE                                       │
│ Theme            (●) System  ( ) Light  ( ) Dark │
│ Interface size   [ Default ▾ ]  (90/100/110%)    │
│ Reduce motion    (●) Follow system  ( ) Always   │
│ Graph            [x] Thicker strokes             │
│                  [x] Show commit ids on nodes    │
│                                                  │
│ TERMINAL AND EDITOR                              │
│ Terminal font size   [ 13 ▾ ]                    │
│ Cursor               ( ) Block (●) Bar           │
│ Bell                 [ ] Visual flash            │
│ Editor font size     [ 13 ▾ ]                    │
│ Line wrap            [x]                         │
│                                                  │
│ LESSONS                                          │
│ ┌ Lesson content ─────────────────────────────┐  │
│ │ Installed 2026.10.03.1 · checked 2 days ago │  │
│ │ [ Check for updates ]                       │  │
│ └─────────────────────────────────────────────┘  │
│ Learning folder   ~/.local/share/canopy/lessons  │
│                   [ Open folder ]  [ Clear all   │
│                                      lesson      │
│                                      folders ]   │
│ Progress          [ Reset all progress… ]        │
│                                                  │
│ ABOUT                                            │
│ Canopy 0.4.0 · git 2.43.0 at /usr/bin/git        │
│ Lesson format 1 · content 2026.10.03.1           │
│ Open-source licenses ›    Log folder ›           │
│ Source and issue tracker ↗                       │
└──────────────────────────────────────────────────┘
```

### 3.7 Content updates (inside Settings → Lessons)

Lives in the "Lesson content" card; also reachable from the Home footer link. The feature is manual only: the app never calls the network unless the learner presses the button.

| State | Card content | Button |
|---|---|---|
| idle | `Installed 2026.10.03.1` · `Checked 2 days ago` (or `Never checked`) | **Check for updates** |
| checking | `Installed 2026.10.03.1` · spinner + `Checking…` | disabled, label `Checking…` |
| up to date | `You have the latest lessons.` · `Checked just now` (success check icon) | **Check again** (ghost) |
| available | `2026.11.02.1 available · 1.8 MB` + "What changed" disclosure (changelog markdown, max-height 240px, scroll) | **Download and install** (primary) · **Not now** (ghost) |
| downloading | determinate bar, `Downloading… 0.9 of 1.8 MB` | **Cancel** (ghost) |
| installing | indeterminate bar, `Installing…` (verifying checksum, swapping folder) | none |
| installed | success check, `Installed 2026.11.02.1. Your progress is unchanged.` · note if an open lesson changed: `The lesson you have open was updated. Reset lesson to load the new version.` | **Done** |
| failed | danger icon, one-line reason (`Could not reach the server`, `Download was interrupted`, `The file did not match its checksum`), disclosure "Details" (raw error) | **Try again** · **Not now** |
| needs newer app | warning icon, `Lesson update 2026.12.01.1 needs Canopy 0.6 or newer (lesson format 2). You have 0.4.0.` | **Download Canopy ↗** |

Rules: a found-but-not-installed update sets a 6px dot on the Settings gear and the Home footer line; both clear when installed or when the learner presses Not now (until the next check). Installing never touches progress (keyed by lesson id). If the currently open lesson's folder changed, show the note above; do not force a reset.

### 3.8 About and licenses

Part of the Settings sheet (above). "Open-source licenses" opens a plain scrollable sheet page with a search field and the bundled license texts grouped by package. Fonts (Inter, JetBrains Mono) and icons (Lucide) are listed there too.

### 3.9 Keyboard shortcuts overlay

`Ctrl+/` opens a centered dialog listing the keymap from section 10.1, in two columns, searchable. Same dialog is linked from Settings → About.

---

## 4. Lesson workspace

### 4.1 Layout

Four regions in three columns. Numbers are defaults at a 1440x900 window.

```
┌ top bar 44 ─────────────────────────────────────────────────────────────────────────────────────┐
│ ⌂ Canopy › 6 Merging › 6.08 Your first conflict        ‹ 6.07   6.09 ›    128/225   ⚙           │
├────────────┬────────────────────────────────────────────────────┬───────────────────────────────┤
│ LESSON     │ GRAPH                      ┌ repo switcher ┐       │ INSPECTOR                     │
│ 360        │ flex                       │work│origin│tm │       │ 320                           │
│            │                            └───────────────┘       │ Files · Changes · Areas · .git│
│ title      │                                                    │                               │
│ banner     │     ○──○──○──●  main                                │  ▸ notes/                     │
│ notice     │          \                                         │    README.md                  │
│ content    │           ○──○  feature  ◎HEAD                     │    recipe.txt  M              │
│ actions    │                                                    │                               │
│ questions  │                                                    │                               │
│ hints      ├────────────────────────────────────────────────────┤                               │
│            │ TERMINAL                   work ·  bash            │                               │
│ ────────── │ $ git merge feature                                │                               │
│ GOALS      │ Auto-merging recipe.txt                            │                               │
│ ✓ ○ ○      │ CONFLICT (content): Merge conflict in recipe.txt   │                               │
│ [Reset]    │ $ █                                                │                               │
└────────────┴────────────────────────────────────────────────────┴───────────────────────────────┘
```

| Region | Default | Min | Max | Collapsible | Persisted |
|---|---|---|---|---|---|
| Lesson panel (left) | 360px | 300px | 480px | yes → 36px rail | width, collapsed |
| Center column | remaining | 480px | – | no | – |
| Graph (center top) | 48% of center height | 160px | – | yes → 32px strip | ratio, collapsed |
| Terminal (center bottom) | 52% of center height | 180px | – | no | – |
| Inspector (right) | 320px | 260px | 560px | yes → 36px rail | width, collapsed, active tab |

- Resize handles are 1px borders with a 10px invisible hit area; cursor `col-resize` / `row-resize`; the handle shows a 2px accent line while hovered or dragged. Double-click resets that handle to default. Dragging below the min snaps the pane closed (collapsed rail) with the same 160ms transition as the collapse button; dragging a rail open restores the last width.
- Collapsed rails show a vertical label ("Lesson", "Files") and, for the lesson rail, the goal count chip ("1/3") so progress stays visible.
- Sizes persist per learner (not per lesson).

**Small windows (1100x700 minimum).** At content width below 1280px: lesson panel default becomes 300, inspector 260, center gets the rest (≥ 540). Terminal at 540px wide with 13px JetBrains Mono gives 68 columns, which is enough for `git status` and `log --oneline`. Below 1100px wide (not supported, but must not break): the inspector auto-collapses to its rail; below 960px the lesson panel auto-collapses too; a one-line banner says "Canopy works best at 1100 px or wider." The graph at minimum height (160px) shows 2 lanes; the graph strip supports vertical scroll with a sticky HEAD indicator.

**Large windows (≥ 1800px).** Lesson panel and inspector keep their widths (max 480 / 560); the center grows. Terminal has no max width; the lesson content column inside the panel caps at 440px measure for readability. Graph has horizontal (time) extent; extra width is used to expand the collapsed "N earlier commits" node on demand, not automatically.

### 4.2 Lesson panel anatomy

Top to bottom. Everything above GOALS scrolls; GOALS is pinned.

```
┌ LESSON ──────────────────────────────────── ‹ › ─┐  pane header 36px: label, prev/next lesson icons
│ 6.08 · CONCEPT                                   │  id and kind, 11px caps fg3
│ Your first conflict                              │  20px/28 semibold
│ Teaches  [conflict-read]                         │  12px fg3 "Teaches" + one mono outline chip per `teaches` skill id (ids are not humanized)
│                                                  │
│ ┌ ⚠ Destructive commands ahead ────────────────┐ │  banner (only for `destructive` flag)
│ │ This lesson throws away work on purpose.      │ │
│ │ Only the learning folder changes, and Reset   │ │
│ │ lesson brings it back.                        │ │
│ └───────────────────────────────────────────────┘ │
│ ┌ ⓘ Recommended first ─────────────────────────┐ │  notice (only when prerequisites incomplete)
│ │ 6.02 Three-way merge · 2.07 See what changed  │ │  each title is a link; dismiss ✕ for this lesson
│ └───────────────────────────────────────────────┘ │
│                                                  │
│ (content.md rendered)                            │  14px/22 body, `code` in mono chips
│ A conflict happens when …                        │
│ ## Try it                                        │
│ 1. Merge `feature` into `main`.                  │
│ 2. …                                             │
│                                                  │
│ ┌ Events ──────────────────────────────────────┐ │  only when lesson.yaml has `actions`
│ │ ▶ Teammate pushes a fix        {} view script │ │  button + script link; after run: "Ran 1×"
│ └───────────────────────────────────────────────┘ │
│                                                  │
│ ┌ Question ────────────────────────────────────┐ │  one card per question, in order
│ │ Which branch's text sits between <<<<<<< and  │ │
│ │ =======?                                      │ │
│ │ ( ) feature   (●) main   ( ) the merge base   │ │
│ │                           [ Check answer ]    │ │
│ └───────────────────────────────────────────────┘ │
│                                                  │
│ Hints                                            │  only when lesson.yaml has `hints`
│ [ Show hint 1 of 2 ]                             │
│                                                  │
│ ## What just happened  (content.md tail)         │
│ …                                                │
├──────────────────────────────────────────────────┤
│ GOALS                                 1 of 3     │  pinned footer, max 40% of panel height
│ ✓ Answer the question                            │
│ ○ Resolve recipe.txt without markers             │
│ ○ Finish the merge with a commit                 │
│                                                  │
│ ↺ Reset lesson                      [ Next → ]   │  Next is disabled (ghost) until complete
└──────────────────────────────────────────────────┘
```

Behavior:
- **Goals** re-check after each command, save and answer. A newly passed goal animates its check (opacity, 160ms) and is announced via `aria-live="polite"`. A sticky goal that passed keeps its check even if the state later changes; its row shows a small "kept" pin icon with tooltip "This goal stays done once reached."
- A goal that passed and then un-passed (non-sticky) returns to pending without any red state. There is never a "failed" goal visual; pending is the only non-passed state.
- **Lesson complete moment** (all goals pass): the GOALS header turns into a success band "Lesson complete" with a check; the Next button becomes primary; a single inline card slides up (translateY 8px → 0, opacity, 240ms) above the footer: "Done. Next: 6.09 Resolve a conflict." with [Next lesson] [Stay here]. No auto-navigation, no sound, no confetti. The top-bar counter increments with a 160ms opacity cross-fade. Completing an already-complete lesson shows the band but no card (no change in progress).
- **Reset lesson** opens a confirm dialog (copy in 11.4). On confirm: terminal shows a one-line system message (`— lesson reset —`, fg3) and a fresh prompt; graph cross-fades to the setup state; goals clear (except nothing: sticky goals also clear, since the attempt restarts); answers clear.
- **Prev/Next** always enabled regardless of completion, except Next is styled primary only when complete. Navigating away from an incomplete lesson needs no confirmation.
- **Guided** lessons show a "Guided" chip next to the kind; no other layout change (content already contains commands).
- **Optional** lessons show an "Optional" chip and, in the goals footer, a ghost "Skip lesson" link (section 7.5 for the semantics).

### 4.3 Recommended-first notice

Soft and non-blocking. Shown at the top of the lesson panel when any skill in `requires` is not taught by a lesson the learner has completed. Lists up to three lesson titles (the ones that teach the missing skills, lowest id first); if more, "+2 more" opens the full list in a popover. Dismiss hides it for this lesson until progress changes. It is never shown on boss lessons of a section where all other lessons are complete.

### 4.4 Center column: graph pane

Pane header (36px): `GRAPH` label · repo context (single-repo lessons) or repo switcher (segmented) · operation chip ("Merge in progress · conflict", "Rebase in progress · 2 of 4") · right side: "Follow terminal" toggle (multi-repo only), "Show origin side by side" icon toggle (`columns-2`, shown whenever the lesson has a bare `origin`), collapse chevron. A view menu (⋯: Fit, Show reflog trail, Show commit ids, Collapse old history, Graph as text) is specified but not yet implemented (see Implementation status).

- **Repo switcher** appears only when `repos` has more than one entry. Segments use the labels from `lesson.yaml` ("Your clone", "origin", "Teammate"). The segment whose repo contains the terminal's cwd shows a small terminal glyph before its label. Default: *Follow terminal* on; the graph shows whatever repo the shell is in. Clicking a segment turns following off (toggle animates to off) and pins that repo; turning Follow back on re-syncs.
- **Side by side** splits the graph pane horizontally: pinned repo left, `origin` right (origin is always the right side). Only offered when the lesson has an `origin` repo. Each half has its own small label; HEAD is shown per repo.
- Empty state (no commits): centered fg3 text "No commits yet." plus a ghost node outline where the first commit will land.
- Section 1–4 lessons that have `repo: null` (pure terminal) hide the graph pane entirely; the terminal takes the whole center column and the inspector shows Files.

### 4.5 Center column: terminal pane

Pane header: `TERMINAL` · cwd in mono, as the path relative to the lesson root (`work`, `work/notes`, `.` for the root itself, and the text `outside the learning folder` when the shell has left it) · right: font size −/+, "Clear", a "Keyboard: Alt+1–4 to leave the terminal" hint icon; destructive lessons add the "destructive lesson" warning chip.

- xterm.js with the ANSI palette from section 5. Cursor bar 2px, blinks only when focused.
- First time the terminal gets focus in a session, a one-line dismissible hint appears under the header: "Tab completes commands here. Press Alt+1–4 or F6 to move to another pane." (fg3, 12px). Never shown again after dismiss.
- An in-app editor request (commit message, rebase todo) opens the **editor sheet** over the graph pane (section 4.7). The terminal remains visible and shows git's waiting state.
- When the lesson runner resets the lesson, the terminal prints the system line in fg3 italics via the PTY (not xterm decorations) so it scrolls like normal output.
- If the learner `cd`s above the learning folder, a one-line warning banner appears under the terminal header: "You left the learning folder. Canopy only watches repos inside it." with [Go back] (runs nothing automatically; it pastes `cd <lesson root>` into the prompt only if the input line is empty). Dismissable.

### 4.6 Inspector (right pane)

Tabs: **Files** (always) · **Changes** (`diff` panel) · **Areas** (`three-areas`) · **.git** (`inside-git`). Tabs beyond Files appear only when `lesson.yaml` lists the panel; the first listed panel is active when the lesson opens, otherwise Files.

**Files tab**
```
┌ FILES ───────────────── project ─ ⟳ ┐
│ ▾ project/                           │  tree: 24px rows, 12px indent per level
│   ▸ .git/            (special icon)  │  .git shown but dimmed; expands in .git tab instead
│     .gitignore                       │
│     README.md                        │
│     recipe.txt            M  !       │  status glyphs: A M D R ? and ! for conflicted
│   ▸ notes/                           │
└──────────────────────────────────────┘
```
- Clicking a file opens it in the editor. The inspector widens to 50% of (center + inspector) width ("editor mode") with a 240ms width transition; closing the editor (✕ or `Esc` from the editor) restores the previous width. Tree collapses to a 160px top strip in editor mode with the open file highlighted; a breadcrumb shows the path.
- Status glyphs: `?` untracked (fg3), `A` added (success), `M` modified (warning), `D` deleted (danger), `R` renamed (accent), `!` conflicted (danger, bold, plus the row gets a danger-soft background). Glyphs are text, not color only.
- Conflicted file in editor: markers `<<<<<<<`, `=======`, `>>>>>>>` get a mono bold style; the "ours" block background is `conflict-ours` (blue-tinted) and "theirs" is `conflict-theirs` (green-tinted), each with a left gutter label "HEAD (main)" / "feature" so color is not the only cue. Base block (diff3) is sunken gray with label "base".

**Changes tab (diff panel)**: a native `<select>` for the scope at the top (28px, `edge-2` border, options `Working tree vs staging` / `Staging vs HEAD` / `Working tree vs HEAD`, accessible name "Scope") and a file list on the left (120px) when more than one file. Unified diff, line numbers both sides, `diff-add` / `diff-del` row tints plus `+`/`−` gutter glyphs. Hunk headers in fg3 mono. Word-level highlights are a 1px underline, not a second fill.

**Areas tab (three-area panel)**
```
┌ AREAS ───────────────────────────────────────┐
│  WORKING TREE     STAGING       HEAD          │  three equal columns, 11px caps headers
│  ┌─────────┐      ┌─────────┐   ┌─────────┐   │
│  │todo.txt │ ──▶  │todo.txt │ ▶ │todo.txt │   │  file cards; arrows are static glyphs
│  │buy milk │      │buy milk │   │(absent) │   │  card shows first 3 lines of that version
│  │buy bread│      │         │   │         │   │
│  └─────────┘      └─────────┘   └─────────┘   │
│  README.md ═      README.md ═   README.md     │  identical versions collapse to one line with ═
└──────────────────────────────────────────────┘
```
- One row per path. A card is highlighted (border2 → accent border, 240ms) when that version just changed. Differences between adjacent columns are shown by a small "differs" chip on the right-hand card's header, and the arrow between the columns becomes solid; identical versions show `═` and a dotted arrow. Clicking a card opens that version read-only in the editor (title shows "todo.txt · staging").

**.git tab (inside .git)**: three stacked collapsibles: **Refs** (table: ref → short id, packed/loose badge), **Index** (path, mode, stage, blob short id), **Objects** (count by type; a search box that accepts a hash prefix and shows `cat-file -p` output in mono). Changes highlight the row for one transition. Useful outside section 14 too, so the view menu offers "Show .git tab" for any repo lesson.

### 4.7 Editor sheet (git-driven editor)

Decided and implemented: the git-driven editor is a sheet over the graph pane, not a tab in the inspector. When `GIT_EDITOR` / `GIT_SEQUENCE_EDITOR` fires, a sheet slides down over the graph pane (translateY −8px → 0, opacity, 200ms):

```
┌ COMMIT MESSAGE ─────── git is waiting for this file ─── [Abort]  [Save and continue] ┐
│ 1  Merge branch 'feature'                                                             │
│ 2                                                                                     │
│ 3  # Conflicts:                                                                       │
│ 4  #   recipe.txt                                                                     │
└───────────────────────────────────────────────────────────────────────────────────────┘
```
- Title reflects the file: Commit message / Rebase todo / Merge message / Tag message. For the rebase todo, the words `pick squash fixup reword edit drop` get a mono chip style and a one-line legend sits under the header.
- `Ctrl+Enter` saves and continues; `Esc` asks "Abort this edit? git will cancel the operation." Abort writes nothing and exits non-zero. Focus moves into the editor automatically and returns to the terminal on close.
- The graph is still there underneath (sheet covers it fully); the terminal below shows git's waiting line.

### 4.8 Destructive banner, tool preflight, minGit

- **Destructive** (flag): warning banner at the top of the lesson panel (4.2). Additionally, the terminal pane header gets a small "destructive lesson" warning chip for the lesson's duration. Nothing else changes. Not shown as a modal.
- **Tool missing** (`tools: [gpg]` and preflight fails): the lesson panel shows, in place of the content, a card: heading "This lesson needs gpg", body "Canopy could not find `gpg` on this computer. Install it and press Check again, or skip this lesson." with [Check again] [Skip this lesson] and, when the lesson offers a fallback (e.g. SSH signing), [Use ssh-keygen instead]. Skip marks the lesson complete with the skipped sub-state (7.5). The content is still readable below a disclosure "Read the lesson anyway".
- **Needs newer git** (`minGit` above installed): the same card pattern with heading "This lesson needs git 2.38 or newer" and [Skip this lesson]; no Check again (restarting Canopy re-checks). The row in the section list carries the "Needs git 2.38" chip.

### 4.9 Actions ("Events")

- Each action is a secondary button with a play glyph and its label. Next to it, a `{}` icon button "View script" opens the script read-only in the editor (inspector widens as in editor mode, title "actions/teammate-push.sh · read-only").
- While running: button shows a spinner and is disabled; the graph for the affected repo animates when the snapshot lands. After: button label unchanged, a fg3 suffix "Ran 1×" (increments). Toast on completion: "Teammate pushed 1 commit to origin/main." (text from the script's last `echo` line, else a generic "Event finished."). Failures toast as danger with "Show output".
- Actions are never run automatically; lessons that need a push "to happen" tell the learner to press the button in content.md.

---

## 5. Design tokens (Tailwind v4 `@theme`)

Implementation note: Tailwind v4 reads `@theme` variables to generate utilities (`bg-surface`, `text-fg-2`, `border-edge`). Theme switching is done by redefining the `--color-*` variables on `:root` under `[data-theme="dark"]` and the system media query, so the utilities stay the same in both themes. The `@theme` block defines light; the overrides follow. The `data-theme` attribute is set by the app from the setting (`system` → not set, so the media query applies).

```css
@import "tailwindcss";

@theme {
  /* ---- Surfaces (light) ---- */
  --color-bg:        oklch(97% 0.004 250);   /* #F3F5F8 app background */
  --color-surface:   oklch(100% 0 0);        /* #FFFFFF panes, cards */
  --color-raised:    oklch(100% 0 0);        /* #FFFFFF popovers, sheets (border carries elevation) */
  --color-sunken:    oklch(96% 0.005 250);   /* #EEF0F3 inputs, terminal, selected rows */
  --color-canvas:    oklch(98% 0.003 250);   /* #F9FAFC graph canvas */

  /* ---- Text ---- */
  --color-fg:        oklch(22% 0.012 260);   /* #171B20  17.3:1 on surface */
  --color-fg-2:      oklch(45% 0.012 260);   /* #51555C   7.4:1 secondary */
  --color-fg-3:      oklch(57% 0.010 260);   /* #74787D   4.5:1 tertiary, meta */
  --color-fg-inverse:oklch(99% 0 0);         /* #FCFCFC on ink and on light-theme graph fills */

  /* ---- Borders ---- */
  --color-edge:      oklch(88% 0.006 250);   /* #D5D8DB default 1px borders */
  --color-edge-2:    oklch(80% 0.008 250);   /* #BABEC3 controls, hover borders (1.9:1 on surface; decorative only) */

  /* ---- Accent (teal; never used on the graph) ---- */
  --color-accent:        oklch(50% 0.088 185);  /* #00736A 5.7:1 on surface */
  --color-accent-fg:     oklch(99% 0 0);
  --color-accent-soft:   oklch(95% 0.030 185);  /* #D9F6F1 tints */
  --color-selection:     oklch(92% 0.030 185);  /* #D0ECE7 selected rows, editor selection */

  /* ---- Ink (primary buttons are neutral, not colored) ---- */
  --color-ink:        oklch(22% 0.012 260);  /* #171B20 */
  --color-ink-fg:     oklch(99% 0 0);

  /* ---- Semantic ---- */
  --color-success:       oklch(52% 0.140 145); /* #267D30 5.2:1 */
  --color-success-soft:  oklch(95% 0.040 145); /* #DFF6DE */
  --color-warning:       oklch(55% 0.118 70);  /* #9D6304 5.0:1 */
  --color-warning-soft:  oklch(96% 0.036 80);  /* #FFF0D7 */
  --color-danger:        oklch(52% 0.170 25);  /* #B63132 6.0:1 */
  --color-danger-soft:   oklch(95% 0.024 25);  /* #FEE9E6 */
  --color-focus:         oklch(55% 0.150 250); /* #0F74C5 ring, 4.9:1 */

  /* ---- Diff / conflict tints (backgrounds behind fg text) ---- */
  --color-diff-add:        oklch(95% 0.050 145); /* #DBF8DA */
  --color-diff-del:        oklch(95% 0.024 25);  /* #FEE9E6 */
  --color-conflict-ours:   oklch(93% 0.034 250); /* #D7EAFE */
  --color-conflict-theirs: oklch(93% 0.050 150); /* #D1F2D7 */
  --color-conflict-base:   oklch(94% 0.004 250); /* #E9EBEE */

  /* ---- Terminal (light): bg = sunken ---- */
  --color-term-bg:        oklch(96% 0.005 250); /* #EEF0F3 */
  --color-term-fg:        oklch(22% 0.012 260);
  --color-term-cursor:    oklch(50% 0.088 185);
  --color-term-selection: oklch(92% 0.030 185);
  --color-ansi-0:  oklch(25% 0.010 260);  /* black        #1F2227 14.0:1 */
  --color-ansi-1:  oklch(50% 0.160 25);   /* red          #AC3031  5.7:1 */
  --color-ansi-2:  oklch(48% 0.130 145);  /* green        #207029  5.4:1 */
  --color-ansi-3:  oklch(50% 0.104 80);   /* yellow       #825B00  5.3:1 */
  --color-ansi-4:  oklch(50% 0.140 255);  /* blue         #2063B0  5.3:1 */
  --color-ansi-5:  oklch(50% 0.140 320);  /* magenta      #854494  5.7:1 */
  --color-ansi-6:  oklch(50% 0.084 200);  /* cyan         #057176  5.1:1 */
  --color-ansi-7:  oklch(56% 0.010 260);  /* white (dim)  #71757A  4.1:1 (used for de-emphasis) */
  --color-ansi-8:  oklch(45% 0.010 260);  /* bright black #52555B  6.5:1 */
  --color-ansi-9:  oklch(45% 0.170 25);   /* bright red   #9E141E  7.1:1 */
  --color-ansi-10: oklch(42% 0.130 145);  /* bright green #045E17  7.0:1 */
  --color-ansi-11: oklch(45% 0.092 80);   /* bright yellow#704E03  6.6:1 */
  --color-ansi-12: oklch(45% 0.148 255);  /* bright blue  #0053A4  6.6:1 */
  --color-ansi-13: oklch(45% 0.150 320);  /* bright mag.  #783288  7.1:1 */
  --color-ansi-14: oklch(45% 0.076 200);  /* bright cyan  #026266  6.3:1 */
  --color-ansi-15: oklch(22% 0.010 260);  /* bright white #181B1F 15.2:1 */

  /* ---- Graph palette (light): L 50%, C 0.12 (clipped to sRGB where noted) ---- */
  --color-graph-main:        oklch(45% 0.010 260); /* #52555B neutral anchor   7.1:1 on canvas */
  --color-graph-0:  oklch(50% 0.120 250); /* blue    #2266A4 5.7:1 */
  --color-graph-1:  oklch(50% 0.120 30);  /* red     #9C4438 6.1:1 */
  --color-graph-2:  oklch(50% 0.120 150); /* green   #21763C 5.4:1 */
  --color-graph-3:  oklch(50% 0.120 320); /* magenta #814A8D 6.1:1 */
  --color-graph-4:  oklch(50% 0.108 70);  /* amber   #8A5601 5.9:1 (C clipped) */
  --color-graph-5:  oklch(50% 0.120 285); /* violet  #5D57A4 6.0:1 */
  --color-graph-6:  oklch(50% 0.084 200); /* cyan    #057176 5.5:1 (C clipped) */
  --color-graph-7:  oklch(50% 0.108 110); /* lime    #676803 5.7:1 (C clipped) */
  --color-graph-unreachable: oklch(62% 0 0); /* #868686 3.5:1 */
  --color-graph-ghost:       oklch(62% 0 0); /* drawn at 55% opacity, dashed */
  --color-graph-head:        oklch(22% 0.012 260); /* ring = fg */
  --color-graph-highlight:   oklch(50% 0.088 185 / 0.14); /* range bands, accent at 14% */
  --color-graph-label-fg:    oklch(99% 0 0); /* text on filled flags */

  /* ---- Type ---- */
  --font-sans: "Inter Variable", "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace;
  --text-2xs: 11px;  --text-2xs--line-height: 16px;
  --text-xs:  12px;  --text-xs--line-height: 18px;
  --text-sm:  13px;  --text-sm--line-height: 20px;
  --text-base:14px;  --text-base--line-height: 22px;
  --text-lg:  16px;  --text-lg--line-height: 24px;
  --text-xl:  20px;  --text-xl--line-height: 28px;
  --text-2xl: 24px;  --text-2xl--line-height: 32px;

  /* ---- Radii ---- */
  --radius-sm: 4px;   /* controls, chips */
  --radius-md: 6px;   /* cards, inputs */
  --radius-lg: 8px;   /* dialogs, sheets */
  --radius-pill: 999px;

  /* ---- Motion ---- */
  --ease-out:   cubic-bezier(0.2, 0, 0, 1);
  --ease-inout: cubic-bezier(0.4, 0, 0.2, 1);
  --dur-fast:   120ms;
  --dur-base:   160ms;
  --dur-slow:   240ms;
  --dur-graph:  320ms;

  /* ---- Layout ---- */
  --spacing: 4px;                /* Tailwind v4 spacing unit: p-2 = 8px, p-4 = 16px */
  --size-topbar: 44px;
  --size-pane-header: 36px;
  --size-rail: 36px;
}

/* ---- Dark overrides (same utilities, new values) ---- */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

:root[data-theme="dark"],
:root:not([data-theme="light"]) { /* second selector applies only inside the media query below */ }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { @apply canopy-dark; }
}
:root[data-theme="dark"] { @apply canopy-dark; }

@utility canopy-dark {
  color-scheme: dark;
  --color-bg:        oklch(17% 0.012 260);  /* #0C1015 */
  --color-surface:   oklch(22% 0.012 260);  /* #171B20 */
  --color-raised:    oklch(26% 0.012 260);  /* #21242A */
  --color-sunken:    oklch(15% 0.012 260);  /* #080B10 */
  --color-canvas:    oklch(20% 0.012 260);  /* #13161C */
  --color-fg:        oklch(93% 0.008 260);  /* #E5E8ED 14.1:1 on surface */
  --color-fg-2:      oklch(75% 0.010 260);  /* #AAAEB4  7.8:1 */
  --color-fg-3:      oklch(62% 0.010 260);  /* #83868C  4.8:1 */
  --color-fg-inverse:oklch(15% 0.010 260);  /* #090B0F */
  --color-edge:      oklch(30% 0.012 260);  /* #2A2E34 */
  --color-edge-2:    oklch(38% 0.012 260);  /* #3F4349 */
  --color-accent:        oklch(78% 0.110 185); /* #55CEC0 9.1:1 */
  --color-accent-fg:     oklch(15% 0.010 260);
  --color-accent-soft:   oklch(30% 0.040 185); /* #123430 */
  --color-selection:     oklch(35% 0.050 185); /* #15433E */
  --color-ink:           oklch(93% 0.008 260);
  --color-ink-fg:        oklch(17% 0.012 260);
  --color-success:       oklch(78% 0.130 145); /* #80CD82 9.1:1 */
  --color-success-soft:  oklch(30% 0.050 145); /* #1D341E */
  --color-warning:       oklch(80% 0.130 70);  /* #F3AE58 9.1:1 */
  --color-warning-soft:  oklch(30% 0.050 75);  /* #3C2A0E */
  --color-danger:        oklch(74% 0.150 25);  /* #FB817A 7.0:1 */
  --color-danger-soft:   oklch(30% 0.060 25);  /* #47211E */
  --color-focus:         oklch(75% 0.130 250); /* #6AB3FD 7.8:1 */
  --color-diff-add:        oklch(28% 0.050 145); /* #182F19 */
  --color-diff-del:        oklch(28% 0.060 25);  /* #421C19 */
  --color-conflict-ours:   oklch(30% 0.050 250);
  --color-conflict-theirs: oklch(30% 0.050 150);
  --color-conflict-base:   oklch(27% 0.006 260);
  --color-term-bg:        oklch(15% 0.012 260); /* #080B10 */
  --color-term-fg:        oklch(93% 0.008 260);
  --color-term-cursor:    oklch(78% 0.110 185);
  --color-term-selection: oklch(35% 0.050 185);
  --color-ansi-0:  oklch(30% 0.010 260);  /* #2B2E33 (black on dark bg: 1.4:1, by convention) */
  --color-ansi-1:  oklch(74% 0.150 25);   /* #FB817A  8.0:1 */
  --color-ansi-2:  oklch(78% 0.130 145);  /* #80CD82 10.3:1 */
  --color-ansi-3:  oklch(82% 0.130 85);   /* #EBBD57 11.2:1 */
  --color-ansi-4:  oklch(76% 0.120 255);  /* #7CB4FC  9.2:1 */
  --color-ansi-5:  oklch(78% 0.120 320);  /* #D99EE7  9.4:1 */
  --color-ansi-6:  oklch(80% 0.100 200);  /* #64D1D7 10.9:1 */
  --color-ansi-7:  oklch(85% 0.008 260);  /* #CBCED3 12.5:1 */
  --color-ansi-8:  oklch(55% 0.010 260);  /* #6E7278  4.1:1 */
  --color-ansi-9:  oklch(80% 0.114 25);   /* #FFA098 10.1:1 */
  --color-ansi-10: oklch(85% 0.130 145);  /* #96E498 13.0:1 */
  --color-ansi-11: oklch(88% 0.120 85);   /* #FCD176 13.6:1 */
  --color-ansi-12: oklch(82% 0.090 255);  /* #9DC7FE 11.3:1 */
  --color-ansi-13: oklch(84% 0.110 320);  /* #EBB3F7 11.6:1 */
  --color-ansi-14: oklch(86% 0.090 200);  /* #85E3E8 13.3:1 */
  --color-ansi-15: oklch(96% 0.004 260);  /* #F0F2F4 17.5:1 */
  /* Graph (dark): L 78%, C 0.11 */
  --color-graph-main:        oklch(80% 0.010 260); /* #BABEC4 9.7:1 on canvas */
  --color-graph-0:  oklch(78% 0.110 250); /* #80BDFB 9.1:1 */
  --color-graph-1:  oklch(78% 0.110 30);  /* #F69C8D 8.7:1 */
  --color-graph-2:  oklch(78% 0.110 150); /* #82CB92 9.4:1 */
  --color-graph-3:  oklch(78% 0.110 320); /* #D7A0E3 8.7:1 */
  --color-graph-4:  oklch(78% 0.110 70);  /* #E5AB66 8.9:1 */
  --color-graph-5:  oklch(78% 0.110 285); /* #B0ADFB 8.8:1 */
  --color-graph-6:  oklch(78% 0.110 200); /* #4ECCD3 9.4:1 */
  --color-graph-7:  oklch(78% 0.110 110); /* #BBBE67 9.2:1 */
  --color-graph-unreachable: oklch(55% 0 0); /* #717171 3.7:1 */
  --color-graph-ghost:       oklch(55% 0 0);
  --color-graph-head:        oklch(93% 0.008 260);
  --color-graph-highlight:   oklch(78% 0.110 185 / 0.16);
  --color-graph-label-fg:    oklch(15% 0.010 260); /* dark text on light fills */
}
```

(If `@apply` of a custom utility into a variable block proves awkward in the build, duplicate the dark block literally under both selectors; the values are what matter.)

### 5.1 Contrast verification

Computed from OKLCH → sRGB → WCAG relative luminance (script kept in the design notes; values rounded).

**Graph marks vs canvas (needs ≥ 3:1)** — light: main 7.1, blue 5.7, red 6.1, green 5.4, magenta 6.1, amber 5.9, violet 6.0, cyan 5.5, lime 5.7, unreachable 3.5. Dark: main 9.7, blue 9.1, red 8.7, green 9.4, magenta 8.7, amber 8.9, violet 8.8, cyan 9.4, lime 9.2, unreachable 3.7. All pass.

**Branch flag labels (text on filled flag, needs ≥ 4.5:1)** — light (white text on each hue): 5.8 / 6.2 / 5.5 / 6.2 / 6.0 / 6.1 / 5.6 / 5.7, main 7.2. Dark (near-black text on each hue): 9.9 / 9.4 / 10.3 / 9.4 / 9.7 / 9.6 / 10.3 / 10.0, main 10.5. All pass AA; dark passes AAA.

**Outlined labels (remote-tracking flags, tags: hue text on canvas)** — identical to "marks vs canvas" above, all ≥ 5.4:1 light and ≥ 8.7:1 dark, so AA for 11px semibold text holds.

**UI text** — fg 17.3 / 14.1; fg-2 7.4 / 7.8; fg-3 4.5 / 4.8 on surface (fg-3 drops to 3.9 light on sunken: use fg-2 for meta text on sunken backgrounds). Semantic colors as text on surface: success 5.2 / 9.1, warning 5.0 / 9.1, danger 6.0 / 7.0, accent 5.7 / 9.1, focus 4.9 / 7.8.

**Terminal** — all 16 ANSI colors ≥ 4.1:1 on the terminal background in both themes except ANSI black on the dark terminal (1.4:1, inherent to the convention; git does not emit black foreground). Light ANSI 7 (dim white) is 4.1:1 and is used by git only for de-emphasis.

### 5.2 Branch → hue assignment

`index = fnv1a32(branchName) % 8`; `main` (and `master` if a lesson uses it) always takes `graph-main`. Collision rule: if two *visible* branches hash to the same slot, the lexicographically later name probes to the next free slot; the assignment is recomputed per snapshot but is stable while the set of visible branches is unchanged. Remote-tracking branches use the hue of their local counterpart name (`origin/feature` = `feature`'s hue) so the pair is visibly related; they differ by outline style (section 8). Tags are hue-less (fg stroke).

The accent (teal 185) and all semantic colors are deliberately absent from the graph palette; graph hues are deliberately absent from UI chrome. A learner never sees "the blue button" and "the blue branch" compete.

---

## 6. Typography, spacing, radii, icons

**Fonts (bundled, offline)**
- UI: **Inter Variable** via `@fontsource-variable/inter` (weights used: 400, 500, 600). Enable `font-feature-settings: "cv11", "ss01", "tnum"` on numerals in progress chips and tables (tabular figures; single-storey a is optional).
- Code/terminal/editor/graph labels: **JetBrains Mono Variable** via `@fontsource-variable/jetbrains-mono` (400, 600). Ligatures **off** (`font-variant-ligatures: none`) in the terminal and editor so `->`, `<=` and `!=` are typed as seen. Hash labels use `tnum` and 600 weight.
- Fallbacks: `system-ui` / `ui-monospace`. Do not ship Fira Code or Inter static: variable fonts keep the bundle to two files.

**Scale** (see tokens): 11/16 (caps labels, chips, graph flags), 12/18 (meta, tooltips, pane headers), 13/20 (default UI, lists, buttons), 14/22 (lesson body, dialogs), 16/24 (card titles), 20/28 (lesson title, section header), 24/32 (home headings). Terminal and editor default 13px with line-height 1.45 (user adjustable 11–18 in Settings). Interface size setting scales the root font (90/100/110%); everything is in `rem`-based utilities except the 1px borders and the graph geometry.

**Weights**: 400 body, 500 buttons/labels/list titles, 600 headings and graph flags. Never 700 in UI; bold in Markdown content renders as 600.

**Spacing**: 4px unit. Pane padding 16; card padding 12 (compact) / 16 (home cards); list row height 40 (section list), 32 (menus, trees 24); control height 28 (default), 32 (primary CTA on home/dialogs), 24 (inline chips/buttons in pane headers). Gaps: 8 within a group, 16 between groups, 24–32 between page sections.

**Radii**: 4 controls and chips, 6 cards/inputs/toasts, 8 dialogs and sheets, pill for flags and counters. Graph nodes are circles; tags are polygons; no radius on pane corners (panes are flush).

**Borders and elevation**: 1px `edge` everywhere; elevation is communicated by surface step (`surface` → `raised`) plus a 1px `edge-2` border, never by shadow on the graph canvas. Popovers, menus and toasts may use a single flat shadow `0 4px 12px oklch(0% 0 0 / 0.12)` (light) / `0.4` (dark) because they are small and short-lived; nothing inside the graph or terminal panes uses shadows.

**Icons**: **Lucide** (ISC). 16px at 1.5 stroke in controls and lists, 20px in the top bar, 14px inside chips. Named icons used: `home`, `settings`, `chevron-left/right/down`, `rotate-ccw` (reset), `play` (action), `braces` (view script), `check`, `circle`, `circle-dot`, `pin` (sticky goal), `lightbulb` (hint), `git-branch`, `git-commit-horizontal`, `tag`, `archive` (stash), `terminal`, `file`, `folder`, `folder-git-2` (.git), `columns-2` (side by side), `eye` (follow terminal), `alert-triangle`, `info`, `x`, `external-link`, `keyboard`, `download`, `refresh-cw`. Icons always have an accessible name (visible text or `aria-label`).

---

## 7. Components

Conventions for all interactive components: `:hover` lightens or darkens the surface by one step, `:active` by two; `:focus-visible` shows the focus ring (2px `focus`, 2px offset, radius +2); `:disabled` sets opacity 0.5 and `cursor: not-allowed` with no hover change. Transitions: background and border 120ms, transform/opacity 160ms. Hit targets ≥ 24px tall; primary CTAs 32px.

### 7.1 Buttons

| Variant | Use | Default | Hover | Active | Disabled |
|---|---|---|---|---|---|
| **Primary** (ink) | one per view: Continue, Next lesson (when complete), Download and install, Confirm | bg `ink`, text `ink-fg`, 500, radius 4, h 28/32, px 12 | bg `ink` 90% opacity | 80% | 50% opacity |
| **Secondary** | most actions (Check answer, Teammate pushes…, Check again) | bg `surface`, 1px `edge-2`, text `fg` | bg `sunken` | bg `sunken`, border `fg-3` | – |
| **Ghost** | low-emphasis (Stay here, Not now, Clear, pane header buttons) | transparent, text `fg-2` | bg `sunken`, text `fg` | – | – |
| **Danger** | confirm in destructive dialogs only | bg `danger`, text `fg-inverse` | 90% | 80% | – |
| **Danger ghost** | Reset lesson, Reset progress entry points | transparent, text `danger` | bg `danger-soft` | – | – |
| **Link** | inline (lesson titles in notices, "view script") | text `accent`, underline on hover only | | | |
| **Icon button** | pane headers, close | 24×24 or 28×28, ghost styling, needs `aria-label` + tooltip | | | |

Loading: replace the leading icon with a 14px spinner, keep width (reserve with `min-width` = measured width), label changes to the progressive form ("Checking…").

### 7.2 Section card (home)

200–240px wide, padding 16, radius 6, 1px `edge`, bg `surface`. Rows: number + title (13px/500, number in fg-3 mono), state line (12px fg-2: "Not started" / "7 of 17" / "✓ Complete" in success), 4px progress bar. States: default; hover (border `edge-2`, bg `raised`, translateY 0 — no lift); focus ring; **current** (2px accent left border + "●" after the title + state line prefixed "Continue ·"); **complete** (bar full in accent, check icon in success). Whole card is a button.

### 7.3 Progress bar

Track 4px, radius pill, bg `edge` (light) / `edge-2` (dark). Fill `accent`; when 100%, fill `success`. Width changes animate 240ms `ease-out` (transform: scaleX with `transform-origin: left`, not width). Always accompanied by text ("7 of 17 · 41%"); `role="progressbar"` with `aria-valuenow/max` and `aria-label="Section 6 progress"`. Overall bar on Home is 6px.

### 7.4 Lesson list row

40px, padding 0 12, grid `24px 48px 1fr auto auto`. Glyph · id (mono fg-3) · title (fg, 500 if next) · tags · kind chip. Hover `sunken`; focus ring inset; **next** row has `sunken` bg and the accent "Next" tag; **complete** row glyph `check-circle` filled in success with title in fg (not dimmed; completed work stays legible); **skipped** row glyph is a hollow check (`circle` + small check, fg-3) with tooltip "Skipped (tool not available)". Right-click / `…` menu per row: "Open", "Mark as not complete" (only on complete rows; used for redo, keeps everything else).

### 7.5 Recommended-first notice and skip semantics

Notice: info banner (section 7.8) with title "Recommended first" and a comma-separated list of linked lesson titles. Non-blocking, dismissible per lesson. Appears in the lesson workspace only. Skip (tool missing / git too old / optional lesson), decided and implemented: marks the lesson complete for progress purposes and stores a `skipped` reason; counts toward "N of M" and the overall count; the row shows the hollow-check glyph (fg-3 circle with a small check, tooltip "Skipped. Counts as done."); redoing it later and completing it for real converts the glyph to the normal filled success check.

### 7.6 Goal checklist item

```
○  Resolve recipe.txt without markers              pending: hollow circle (edge-2 stroke 1.5px), fg text
✓  Answer the question                             passed: filled success circle with check (fg-inverse), fg text
✓  Visit the old commit                 📌         sticky-passed: as passed + pin icon (fg-3) with tooltip
```
32px rows, 14px text, 8px gap. Passing animates the glyph: circle fill opacity 0 → 1 (160ms) and check path opacity 0 → 1 (120ms, 60ms delay). Un-passing reverses instantly (no animation; it should not feel like a punishment). Text never changes style on pass (no strikethrough; the learner still needs to read goals).

### 7.7 Question widget

Card (radius 6, `edge`, padding 12) with the prompt (14px/500) and one of:

- **choice**: radio list (single) or checkbox list (multi) — 32px rows, whole row clickable. 
- **text**: single-line input (mono if the lesson tagged it `mono`, else sans), placeholder from the prompt's noun ("branch name"). 
- **number**: numeric input, 96px wide, `inputmode=numeric`. 
- **commit**: mono input, 160px wide, placeholder "hash or ref", with a hint line "At least 4 characters of the id, or a name like `HEAD~2`." Pasting from the graph works: clicking a node while a commit question is focused inserts its short id.

Footer: secondary button **Check answer** (disabled until a value exists). States:
- **Unanswered**: as above.
- **Correct**: card border becomes `success`, a success line "Correct." replaces the button, inputs become read-only, the matching goal passes. A ghost "Change answer" link re-enables inputs (goal un-passes unless sticky).
- **Wrong**: card border stays `edge`; an inline fg-2 line appears under the input: "Not quite. Try again." (no red text, no shake, no counter). The input keeps the learner's value and focus. For `choice`, the chosen option gets a subtle `sunken` background with an "✕" glyph, cleared on the next selection.
- Keyboard: `Enter` in an input checks; radios use arrow keys; `Enter` on a focused radio checks.

### 7.8 Banners (inline)

Full-width inside their container, radius 6, padding 10 12, 1px border, 13px text, leading 16px icon, optional title in 500, optional actions on the right or below, optional ✕.
- **Info**: bg `accent-soft`, border `accent` at 40%, icon `info` in accent. (Recommended first, terminal hint, newer-git note.)
- **Warning**: bg `warning-soft`, border `warning` at 50%, icon `alert-triangle` in warning. (Destructive lesson, left the learning folder, detached HEAD on the graph.)
- **Danger**: bg `danger-soft`, border `danger` at 50%. (Action failed, update failed.)
- **Success**: bg `success-soft`, border `success` at 50%. (Lesson complete band.)
Text inside banners is always `fg` (never the semantic color) for contrast; the semantic color lives in the icon and border.

### 7.9 Toasts

Bottom-right of the center column (not the window, so they never cover the lesson goals), 320px wide, radius 6, bg `raised`, 1px `edge-2`, flat shadow, 13px, icon by kind, optional one action (ghost) and ✕. Enter: translateY 8px → 0 + opacity, 160ms. Auto-dismiss 5s (none for danger; those stay until closed). Stack max 3, newest at the bottom. `role="status"` (danger: `role="alert"`). Used for: action results, "Copied", update found while on another screen, reset done.

### 7.10 Tabs

Underline tabs: 32px tall, 13px/500, text `fg-2`, active `fg` with a 2px `fg` underline (not accent, to stay quiet); hover `fg`. Inspector tabs that have fresh changes since last viewed show a 6px dot after the label (fg-3) — e.g. Changes after a save.

### 7.11 Pane headers

36px, bg `surface`, bottom 1px `edge`, padding 0 12 (left) / 0 8 (right). Left: label in 11px caps 600 `fg-3` with 0.06em tracking, then context text in 12px mono `fg-2` (repo, cwd). Right: 24px icon buttons; the collapse chevron is always the last. Header is the drag region for nothing (not a window drag). Double-clicking a header toggles collapse.

### 7.12 Repo switcher (segmented control)

28px tall, radius 4, 1px `edge-2` container, segments px 10, 12px/500. Active segment: bg `ink` text `ink-fg` (quiet, consistent with primary buttons); inactive: text `fg-2`, hover `sunken`. The segment that holds the terminal cwd shows a 12px `terminal` icon before the label. "Follow terminal" is an icon toggle (`eye`) to the right of the switcher, pressed state = `accent-soft` bg with accent icon and `aria-pressed`. Keyboard: arrow keys move between segments, `Space` selects.

### 7.13 Tooltips

Appear after 400ms hover or immediately on focus; bg `ink`, text `ink-fg`, 12px, padding 4 8, radius 4, max-width 280px, no arrow, 8px offset. Content is plain text; shortcuts appended as `kbd` chips (`Alt+3`). Never the only way to learn an action's name for touch/keyboard: tooltips mirror `aria-label`.

### 7.14 Hint reveal

Under the content, a disclosure: secondary small button `lightbulb` + "Show hint 1 of 2". On click it becomes a card (bg `sunken`, radius 6, 13px) with the hint text, followed by the next "Show hint 2 of 2" button. Hints never collapse again in this attempt (no hide, so the learner cannot "lose" it); Reset lesson resets them. Copy under the last hint: "That is the last hint." in fg-3.

### 7.15 Dialogs

Centered, 440px (confirm) / 560px (shortcuts), radius 8, bg `raised`, 1px `edge-2`, scrim as in Settings. Title 16px/600, body 14px, actions right-aligned: ghost cancel then the primary/danger confirm. `Esc` cancels; initial focus on the cancel button for destructive dialogs, on the confirm for neutral ones. Enter: translate/opacity 160ms.

### 7.16 Chips

20px tall, 11px/500, radius 4, padding 0 6. **Kind** chips: bg `sunken`, text `fg-2`. **Flag** chips: outline 1px (warning for Destructive and Needs git; `edge-2` for Guided/Optional), text `fg-2`. **Count** chips (`128 / 225`, `1/3`): mono, tnum, bg `sunken`.

### 7.17 Code in lesson content

Inline `code`: mono 13px, bg `sunken`, radius 4, padding 1px 5px, text `fg`. Block code: bg `sunken`, radius 6, padding 12, 13px/20, no line numbers, a ghost "Copy" button top-right that appears on hover/focus. Content never shows commands for `requires` skills (authoring rule), so there is no "Run" button: the learner types.

---

## 8. Graph visual spec

Geometry is in CSS pixels at 100% interface size; the layout function returns these values, the renderer draws them.

**Grid** (as implemented in `GraphView.tsx`): commit spacing `COL = 58px` along the time axis (fits a 7-character id under every node), lane spacing `LANE = 56px` (room for a stack of flags above the tip), `PAD_X = 32`, `PAD_TOP = 64` (room for the HEAD label above a stacked flag group on the top lane), `PAD_BOTTOM = 36`. **Orientation: horizontal, time flows left → right, newest on the right** (matches how the lesson text and `log --graph` are read, and fits the wide center pane). `main` lane is the bottom lane; new branches take lanes above it in creation order; `origin/*` in side-by-side mode draws in its own half. The graph scrolls horizontally and auto-pans so HEAD is visible after every command (pan is a `transform` on the group, 320ms, interrupted = jump).

**Node**: circle r 6 (12px), fill = owner color, no stroke. Owner = first branch whose first-parent walk reaches the commit (`main` first); a commit that is reachable but owned by no branch tip (for example the side of a merge whose branch was deleted afterwards) is drawn in the `main` neutral color, not gray; gray is reserved for unreachable commits. Hover/focus: r 7 + 1.5px `fg` outer ring at 2px offset; tooltip shows `abc1234 · subject · author · relative time`. Click selects (persisting ring) and shows the commit in the Changes tab as "Commit abc1234". Keyboard: the graph is one focusable region; `←/→` move selection along first-parent, `↑/↓` across lanes, `Enter` opens details, `Esc` clears.

**Merge commit**: 12px disc in target color with a 2px inner ring in `canvas` color (reads as a double circle). Octopus: same, plus the extra parent edges.

**Edges**: 2px, round caps, color of the child commit's owner; a merge's incoming edge from the source side uses the source color. Curves: cubic with 14px horizontal handles at lane changes; straight within a lane. Edges draw under nodes.

**HEAD**: 2px ring in `graph-head` (= fg) at 3px outside the node (outer r 11), plus a label "HEAD" in 11px mono 600 fg, placed above the branch flag it is attached to (`HEAD → main` reads top to bottom as "HEAD", then the flag). Detached HEAD: the ring plus the label "HEAD (detached)" directly on the node and a warning banner in the graph pane: "HEAD is detached. New commits here will have no branch." Per-worktree HEADs: each worktree's ring carries a small superscript label with the worktree folder name (`HEAD · hotfix-wt`).

**Branch flag**: pill, height 18, padding 0 7, bg = branch color, text `graph-label-fg` 11px mono 600, positioned right of the tip node with a 2px connector stub in the branch color. Multiple flags on one commit stack **upward** from the tip (2px gap): the local branch flag stays level with the node, remote-tracking flags go above it, tags above those, so the stack grows into the lane gap and never covers the commit id under the node. When the node is HEAD's commit, the `HEAD` label sits 4px above the top of the whole stack, left-aligned with it (not above the current branch flag specifically); nothing else differs (no bold or glow).

**Remote-tracking flag** (`origin/main`): same pill geometry but **outlined**: 1.5px dashed stroke in the branch hue, transparent fill, text in the hue, prefix `origin/` rendered at 400 weight so the local name stands out. Dashed = "a bookmark, not yours to move".

**Tag**: a tag-shaped polygon (rectangle with a 6px pointed left end, 18px tall), 1.5px solid stroke in `fg-2`, fill `canvas`, text 11px mono 500 `fg`. Annotated tags add a small `●` after the name; lightweight have none. Tooltip explains the difference.

**Rewritten originals (ghost)**: node becomes a hollow circle r 6 with a 1.5px **dashed** stroke in `graph-ghost`, fill none, opacity 0.55; its edges become 1.5px dashed in the same gray; subject text (if ids are shown) in fg-3. A **dotted 1.5px arrow** (fg-3, arrowhead 6px) from the ghost to its copy appears for 2 commands' worth of snapshots, then fades. Ghosts stay as long as they are in the reflog window the layout decides to show (default: until the next lesson reset or 20 commands).

**Unreachable commits**: solid fill in `graph-unreachable`, no dash (dash is reserved for "replaced by a copy"); edges in the same gray. A detached-HEAD warning (above) appears when leaving them would orphan commits.

**Revert**: a dashed 1.5px arc (fg-3, dash `4 3`) drawn above the lane from the revert commit back to the commit it undoes (quadratic curve, lift 14–40px depending on distance), with the label "undoes" in 10px mono at the top of the arc; the revert node itself is a normal node.

**Reset**: no special glyph; the branch flag animates backward along the existing nodes (translate along x, 320ms), the now-unreachable commits switch to gray in the same transition (color via opacity cross-fade of two layers if WebKitGTK cannot transition fill cheaply; otherwise a `fill` transition, but never per-frame JS).

**Cherry-pick / rebase**: copies appear with a 320ms translate from the original's position to the landing position (one group transform per command), originals become ghosts, dotted arrows as above. Interactive rebase pauses ("edit", conflict) show a small `pause` glyph on the commit being replayed and a chip in the graph header "Rebase in progress · 2 of 4".

**Stashes**: a "Stashes" strip docked at the bottom of the graph pane (24px tall, appears only when `stashes` is non-empty), each entry a small card `stash@{0} · WIP on main: 3f2a1c0 Add…` with a dashed 1px border and an `archive` icon; a thin dotted leader line to the base commit shows on hover/focus. They are parked outside the lanes on purpose.

**Reflog ghost trail** (view menu toggle): a dashed 1.5px path in fg-3 at 50% opacity through the commits HEAD has visited, with small numbered badges (`@{1}`, `@{2}`) in 10px mono. Off by default except in section 10 lessons, where the lesson can turn it on via `panels`.

**Highlights**: range selections (`A..B`, `HEAD~3`, bisect good/bad) draw a rounded band (radius 10) in `graph-highlight` behind the included nodes and a 1.5px `accent` outline around each; the range expression is shown as a chip in the graph header with ✕ to clear. **Merge base** is a hollow diamond outline (fg-2, 1.5px, 14px) drawn around the node with a "base" label, but it is **never drawn automatically**: lessons 5.09 and 6.02 ask the learner to find the merge base themselves, so the diamond appears only when a lesson or the learner requests it (range highlight of `A...B`, or a future view-menu action). Bisect: `good` nodes get a small check badge, `bad` an ✕ badge, the current test commit gets the selection ring.

**Collapsed history**: "N earlier commits" is a rounded rectangle 18px tall in `sunken` with `edge-2` border and fg-2 text, drawn as the leftmost node; click expands by 20.

**Commit ids on nodes** (setting, default on from section 3): 10px mono fg-3 short id under each node; subjects appear only in tooltips and the details view, so the graph stays uncluttered.

**Side-by-side origin**: the origin half uses the same rules; its flags are *local to origin* (so `main`, not `origin/main`), and the half is titled "origin (bare)".

---

## 9. Motion

| What | Property | Duration / easing |
|---|---|---|
| Buttons, rows, tabs state change | background, border, color | 120ms linear |
| Panels collapse/expand, editor mode width, sheet | width/transform + opacity | 160ms / 240ms `ease-out` |
| Goal check, toast, inline cards, dialogs | opacity + translateY ≤ 8px | 160ms `ease-out` |
| Progress bar fill | transform scaleX | 240ms `ease-out` |
| Graph node/label move, pan, flag move on reset | transform (translate) | 320ms `ease-out` |
| Graph node appear / ghost / unreachable | opacity (and r via transform scale 0.6 → 1 on appear) | 200ms `ease-out` |
| Graph copy arrow (cherry-pick / rebase) | stroke-dashoffset draw-in is **not** used (expensive); it fades in with opacity | 200ms |

Rules:
1. **One animation per command.** The layout diff for a snapshot produces one transition group; everything in it starts together and finishes within 320ms. No staggering, no springs, no per-frame rAF loops for layout.
2. **Interrupt = jump.** If a new snapshot arrives during a transition, finish the previous one instantly and start the new group.
3. **Only `transform` and `opacity` on the canvas.** Color changes on nodes (e.g. becoming unreachable) are implemented as opacity cross-fades between two stacked circles, or applied instantly when that is simpler. Never animate `width`, `height`, `d`, `stroke-dashoffset`, filters or box-shadow.
4. **Nothing idles.** No breathing cursors beyond xterm's blink (which stops when unfocused), no looping spinners outside a true loading state, no animated gradients.
5. **Reduced motion** (`prefers-reduced-motion` or the setting): all durations become 0 except opacity fades, which become 80ms so state changes stay perceivable. Graph movement is instant; the dotted copy arrow still appears so rewritten commits remain explained. Pane resizes are instant.

---

## 10. Accessibility

### 10.1 Keyboard map

The terminal (xterm.js) consumes almost everything, so Canopy reserves a small set of chords that xterm's `attachCustomKeyEventHandler` passes through to the app. These are chosen to not collide with bash or common CLI tools.

| Keys | Action | Works inside terminal |
|---|---|---|
| `Alt+1` / `Alt+2` / `Alt+3` / `Alt+4` | Focus Lesson / Graph / Terminal / Inspector | yes |
| `F6` / `Shift+F6` | Cycle focus forward / backward through panes (Lesson → Graph → Terminal → Inspector → top bar) | yes |
| `Alt+←` / `Alt+→` | Previous / next lesson | yes |
| `Alt+Home` | Home screen | yes |
| `Alt+Shift+R` | Reset lesson (opens confirm) | yes |
| `Alt+H` | Show next hint | yes |
| `Alt+G` | Toggle "Follow terminal" on the graph | yes |
| `Alt+[` / `Alt+]` | Collapse/expand Lesson panel / Inspector | yes |
| `Ctrl+,` | Settings | yes |
| `Ctrl+/` | Keyboard shortcuts | yes |
| `Ctrl+Shift+C` / `Ctrl+Shift+V` | Copy / paste in terminal (Linux convention; `Ctrl+C` stays SIGINT) | terminal only |
| `Ctrl+=` / `Ctrl+-` / `Ctrl+0` | Terminal and editor font size | yes |
| `Esc` | Close sheet/dialog/popover; in the editor sheet: Abort prompt; in the graph: clear selection | not in terminal (bash gets it) |
| `Ctrl+Enter` | Editor sheet: save and continue; question input: check answer | editor/lesson only |
| `Tab` | Native tab order inside non-terminal panes; inside the terminal it goes to bash | – |

Focus leaving the terminal is always possible with `Alt+N` or `F6`; this is shown in the first-focus hint and in the terminal header tooltip. On macOS the same map uses `Option` (document when porting; `Alt+` letters on macOS type special characters, so `Alt+H`/`Alt+G` become `Ctrl+Option+H/G` there).

### 10.2 Focus management

- Each pane is a landmark: `<section role="region" aria-label="Lesson">` etc. The top bar is `<header>`; the lesson content is `<article>`; goals are a `<ul>` with `aria-label="Goals"`.
- Opening a lesson focuses the lesson title (`tabindex=-1`) so screen readers start at the top; the terminal is **not** auto-focused on open (a sighted learner clicks or presses `Alt+3`; the first-focus hint explains). Exception: after Reset lesson, focus returns to where it was.
- Dialogs and sheets trap focus and restore it on close. Toasts never take focus.
- The editor sheet takes focus when git opens it and returns focus to the terminal when it closes.
- Resizers are focusable (`role="separator"`, `aria-orientation`, `aria-valuenow` = width) and respond to arrow keys (8px steps, `Shift` = 32px) and `Enter` (collapse/expand).

### 10.3 Screen reader notes

- Goal changes: `aria-live="polite"` region announces "Goal done: Answer the question (1 of 3)". Lesson complete: "Lesson complete. Next: 6.09 Resolve a conflict." Wrong answer: "Not quite. Try again." via the same region.
- Progress bars expose value and label; section cards are buttons with a composed name "Section 6, Merging, 7 of 17 complete, current section".
- The graph `<svg>` has `role="img"` and a generated `aria-label` summary ("5 commits. Branches: main at 4 commits, feature at 2 commits, diverged from main 2 commits ago. HEAD on main."). A "Graph as text" button (view menu, and announced to AT) opens a plain ordered list of commits with ids, subjects, parents and labels — this is also the printable form. Selection in the graph mirrors into that list.
- Terminal: xterm's accessibility mode is enabled in Settings → Terminal ("Screen reader mode"), which turns on xterm's live region. Canopy's system lines (reset notice) are also sent to the lesson live region.
- Three-area panel cards have names like "todo.txt, staging version, differs from working tree".

### 10.4 Colorblind-safe graph

- Every tip has a text flag, so lane identity never relies on hue.
- Meaning is carried by shape: HEAD ring, tag polygon, dashed outline for remotes, dashed ghost for rewritten, gray fill for unreachable, double circle for merges, diamond for merge base, badges for bisect.
- Lanes are spatially stable; a branch keeps its lane for the lesson.
- Hue slots were chosen so the most common pair (main gray + one branch) and the common triple (main, feature, origin/feature) are distinguishable under deuteranopia/protanopia by lightness-equal but shape-different marks, plus flags. When two visible branches fall into confusable hue pairs (red/green 30/150, amber/lime 70/110) the probe rule in 5.2 pushes the second to the next slot.
- Settings → Appearance → "Thicker strokes" raises all strokes by 1px and node radius to 7 for low-vision users; "Show commit ids on nodes" gives another non-color anchor.

---

## 11. Microcopy

**Tone**: plain, short, specific. Address the learner as "you", refer to the app as "Canopy". Sentences end with periods. No exclamation marks, no "simply/just/easy", no jokes, no emojis. Say what happened, what it means, and what to do next, in that order. Buttons are verbs ("Check again", "Download and install"), never "OK" alone. Numbers are digits.

### 11.1 Empty states

- Graph, no commits: **No commits yet.** "Your first commit will appear here."
- Stash strip hidden until used; if a lesson opens the panel with none: **No stashes.** "Stashed work shows up here, parked next to the graph."
- Section with everything complete: **Section complete.** "Every lesson here is done. Redo any lesson at any time; progress stays."
- Home, nothing started: Continue card title **Start here**, "1.01 Meet the terminal — find out where you are and move around."
- Changes tab, clean tree: **Nothing has changed.** "Edit a file or stage something and the diff shows here."
- Search in licenses: **No matches for "xyz".**

### 11.2 Errors and gates

- Git missing (gate): **Canopy needs git to run.** "Canopy teaches git by running the real thing, and it could not find git on this computer." Buttons: *Get git from git-scm.com*, *Check again*.
- Git too old: **Canopy needs a newer git.** "Found git 2.17.1 at /usr/bin/git. Canopy needs 2.32 or newer because the lessons rely on commands added since then." Same buttons.
- Tool missing for a lesson: **This lesson needs gpg.** "Canopy could not find gpg on this computer. Install it and press Check again, or skip this lesson. Skipping counts it as done." Buttons: *Check again*, *Skip this lesson*, optional *Use ssh-keygen instead*.
- Lesson needs newer git: **This lesson needs git 2.38 or newer.** "You have 2.34.1. Update git to do this lesson, or skip it for now."
- Setup failed: **The lesson could not be set up.** "Its setup script stopped with an error. Try Reset lesson; if it happens again, the log has the details." Buttons: *Reset lesson*, *Open log*.
- Action failed: toast, danger: **"Teammate pushes a fix" did not finish.** *Show output*.
- Left the learning folder: **You left the learning folder.** "Canopy only watches repos inside it. The graph and goals will not update until you go back." *Go back*.
- Update: network: **Could not reach the update server.** "Check your connection and try again. Lessons keep working offline." Checksum: **The download did not match its checksum.** "Nothing was installed. Try again; if it repeats, the file on the server may be bad." Format: **This update needs a newer Canopy.** "Lesson pack 2026.12.01.1 uses lesson format 2. You have Canopy 0.4.0, which reads format 1."
- Shell died: terminal shows **— the shell exited —** and a secondary button *Restart shell* under the header.

### 11.3 Lesson flow

- Goal passed (live region only): "Goal done: {label} ({n} of {m})."
- Wrong answer: "Not quite. Try again."
- Correct answer: "Correct."
- Lesson complete band: **Lesson complete.** Inline card: "Done. Next: 6.09 Resolve a conflict." Buttons: *Next lesson*, *Stay here*.
- Boss lesson complete (last in section): "Done. That finishes Section 6." Buttons: *Next section*, *Stay here*.
- All 225 complete: Home card: **All 225 lessons complete.** "Everything in Canopy is done. Redo any lesson whenever you like; your progress stays."
- Recommended first: **Recommended first** "6.02 Three-way merge, 2.07 See what changed." (titles linked) — no further sentence.
- Destructive banner: **Destructive commands ahead.** "This lesson throws away work on purpose. Only the learning folder changes, and Reset lesson brings it back."
- Detached HEAD (graph banner): **HEAD is detached.** "New commits here belong to no branch. Create a branch if you want to keep them."
- Hint button: "Show hint 1 of 2" → after the last: "That is the last hint."
- Skipped row tooltip: "Skipped (tool not available). Counts as done."
- Terminal first-focus hint: "Tab completes commands here. Press Alt+1–4 or F6 to move to another pane."

### 11.4 Confirmations

- Reset lesson: **Reset this lesson?** "Canopy deletes the lesson folder and builds it again from the start. Your progress in other lessons is not affected." Buttons: *Cancel*, *Reset lesson* (danger). Initial focus: Cancel.
- Reset section progress: **Reset progress for Section 6?** "7 lessons will be marked as not complete. Lesson folders are not touched." Buttons: *Cancel*, *Reset progress* (danger).
- Reset all progress: **Reset all progress?** "All 128 completed lessons will be marked as not complete. This cannot be undone." Buttons: *Cancel*, *Reset all progress* (danger).
- Abort editor: **Abort this edit?** "git will cancel the operation it was waiting on." Buttons: *Keep editing*, *Abort*.
- Clear lesson folders: **Delete all lesson folders?** "Frees disk space. Each lesson is rebuilt when you open it next. Progress stays." Buttons: *Cancel*, *Delete folders* (danger).

---

## 12. Implementation status

Last reviewed against the app in `docs/design/QA.md`. All P1 and P2 findings from that review are implemented and the sections above now describe the shipped behavior. The following P3 items from `QA.md` are specified here but **not yet implemented**:

- QA 14: graph view menu (Fit, Show reflog trail, Show commit ids, Collapse old history) and the "Graph as text" screen-reader alternative (section 4.4, 10.3).
- QA 15: graph keyboard navigation (`←/→`, `↑/↓`, `Enter`, `Esc` on the focused graph region, section 8 "Node").
- QA 16: vertically centering a graph that is shorter than its pane.
- QA 17: copy arrows expiring after two updates and arcing above id labels (section 8 "Cherry-pick / rebase").
- QA 18: question widget details (28px Check answer button, caps-style "Hints" heading).
- QA 19: optional one-line lesson blurb on the home Continue card (section 3.3).
- QA 20: roving tabindex and arrow keys on the repo switcher (section 7.12).

Also not yet implemented: range highlights and bisect badges (section 8 "Highlights"), the reflog ghost trail, per-worktree HEAD labels beyond the dashed ring, and the editor-mode tree strip breadcrumb (section 4.6).

## 13. Open design questions

Each with my recommendation; the design above assumes the recommendation. Items marked **decided** were accepted by the owner during implementation and are no longer open.

1. **Terminal background in light theme.** Recommendation: light terminal (`sunken`) so the screen stays one calm surface. Alternative: always-dark terminal, which many developers expect. If the owner prefers dark-always, keep the dark ANSI set for the terminal in both themes and raise the pane border to `edge-2`.
2. **Skip = complete.** Decided (as recommended). Recommendation: a skipped lesson (tool missing, git too old, optional) counts as complete with a `skipped` sub-state and a hollow check, so sections can reach 100% on any machine. Alternative: skipped lessons are excluded from the denominator ("16 of 16, 1 skipped"), which is more honest but makes "X of 225" vary per machine.
3. **Where the git-driven editor opens.** Decided (as recommended). Recommendation: a sheet over the graph pane (keeps terminal and lesson visible; the graph is not needed while typing a message). Alternative: open in the inspector in editor mode, which keeps the graph visible but pushes the message editor to the far side of the terminal prompt.
4. **Graph orientation.** Decided (as recommended, with the 58/56 grid in section 8). Recommendation: horizontal, newest right, main on the bottom lane. Alternative: vertical newest-top like most git GUIs. Horizontal fits the center pane shape and the "timeline" mental model taught in section 2–3; vertical scales better to long histories, which the "N earlier commits" node mitigates.
5. **Follow-terminal default.** Recommendation: on, and clicking a repo segment pins it (turns following off). Alternative: switcher always manual; simpler to explain, but learners in section 7 will constantly `cd` between `work/` and `teammate/`.
6. **Content update dot.** Recommendation: only after a manual check finds an update (no background checks ever, consistent with "no auto-updater"). Alternative: a passive weekly check with a setting to disable; convenient but contradicts the offline-first promise.
7. **Completion rule for concept lessons.** Recommendation: all questions answered correctly (goal type `answer`); concept lessons without questions complete on a single primary "Continue" at the bottom of the content, which is treated as a sticky goal "Read the lesson". This closes the open decision in ARCHITECTURE 12.
8. **Lesson panel on the left vs right.** Recommendation: left (reading order: instructions → do it → see it). Alternative: right, with graph+terminal flush left; some prefer the terminal nearer the left edge. The prototype shows left.
9. **Showing commit subjects on the graph.** Recommendation: ids only on nodes, subjects in tooltip/details; section 3 lessons that ask "which commit…" can turn on a "subjects" view through `panels: [graph-subjects]` (one more panel id to add to LESSON_FORMAT).
10. **Boss-lesson test-out.** Recommendation: do not implement. Completing a boss lesson completes only that lesson; test-out complicates "completion only" and the home logic for little gain.
