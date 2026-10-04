# UX review decisions

Rulings on `UX_REVIEW.md` (2026-10-03). Goal: clean, functional, minimal, very intuitive. Default stance: when in doubt, remove.

| # | Finding | Decision | Reason |
|---|---|---|---|
| 1 | Nothing says where to type | **Accept.** Focus the terminal when a lesson opens; screen readers get the title through a live announcement. | Beginners must not have to discover the terminal. |
| 2 | Instructions below the fold | **Accept, partly.** Drop the LESSON header, remove the completion card, cap goals at 35%. **Reject** merging "Try it" into goals. | Steps (how) and goals (what is checked) are different; merging them would make goals verbose. |
| 3 | "Next" four times on completion | **Accept.** One band ("Lesson complete") + one primary "Next: <title> →". No card, no "Stay here". | Duplication. |
| 4 | Graph unreadable for newcomers | **Accept.** Commit subjects under nodes by default (ids via setting, hover, selection); click shows a small detail card with id, subject, author and Copy id; one-line dismissible key. HEAD stays (the key explains it). | Subjects are what beginners recognise. |
| 5 | Rewritten history unnamed | **Accept.** Key names grey/dashed commits; copy arrows only for the selected or hovered ghost. | Noise reduction; meaning on demand. |
| 6 | Duplicated nav and progress | **Accept.** Remove top-bar prev/next and the progress chip. Alt+←/→ stay. | Breadcrumb + footer button suffice; progress lives on Home. |
| 7 | Files panel doesn't follow, shows hidden files | **Accept.** The tree expands to and highlights the terminal's folder. Dot-files are hidden in Section 1 only (later lessons edit `.gitignore` in the panel); `.git` is always shown dimmed. | Honour the lesson text; don't spoil 1.01. |
| 8 | Unclear icon-only graph controls | **Accept.** Remove the eye toggle: clicking a repo pins it and a "Follow terminal" text link appears while pinned. "Graph as text" moves to Settings. Side-by-side gets a text label. | Hidden modes and mystery icons are not intuitive. |
| 9 | Jargon before it is taught | **Accept.** Remove the Teaches row and kind/Guided chips; Changes tab only when a lesson lists it (as the spec says); status letters get tooltips. | Titles already say what a lesson teaches. |
| 10 | Terminal header clutter | **Accept.** Remove −/+ and the keyboard icon; show "in <folder>" only off the root; the leave-the-terminal hint shows once, on first focus. Keep Clear. | Duplicates Settings/shortcuts. |
| 11 | No way back from outside the folder | **Accept.** "Go back" button types `cd <lesson folder>` into an empty prompt. | Dead end otherwise. |
| 12 | Loud recommended-first notice | **Accept.** One neutral line: "Easier after: …". | Advisory, not alarming. |
| 13 | Destructive stated three times | **Accept.** Keep only the in-lesson banner. | Don't scare learners off lessons. |
| 14 | Red Reset always visible | **Accept, modified.** Neutral ghost "Reset lesson" (the name lessons use); red stays in the confirm dialog. | Name is referenced by lesson text. |
| 15 | Sticky pin | **Accept.** Remove. | Implementation detail. |
| 16 | Pane header labels | **Accept, partly.** Remove the Lesson header; Graph/Terminal headers stay because they hold controls. | Minimal but functional. |
| 17 | Chevron overload | **Accept.** Panel icons for collapse; nav chevrons removed by 6. | Distinguish collapse from navigation. |
| 18 | Changing tab sets | **Accept.** Fixed order Files · Changes · Areas · .git; tabs appear only when a lesson uses them; empty states tie to the task. | Predictability. |
| 19 | Over-signalled current section, discouraging 0% bar | **Accept.** Keep only the left border; hide the overall bar until a lesson is done; rename the "Core" level to "Everyday". | Fewer, consistent cues. |
| 20 | Kind chip on every row, red reset at eye level | **Accept.** Remove kind chips; section reset becomes a quiet link at the bottom. | Noise. |
| 21 | Goals not connected to questions | **Accept.** Clicking a question goal scrolls to and focuses the question. | Direct manipulation. |
| 22 | "Events" / "View script" | **Accept, modified.** Drop the "Events" heading; keep "What does this do?" as a quiet link (Canopy's "nothing is hidden" principle). | Transparency without jargon. |
| 23 | Cramped at 1100 | **Accept.** Inspector starts collapsed below 1280px wide. | Least essential region. |
| 24 | Shortcuts not discoverable | **Accept.** Settings row "Keyboard shortcuts". | |
| 25 | Graph label collisions | **Accept.** "HEAD" sits on the ringed node, not at the top of the flag stack. | Proximity. |
| 26 | First-run friction | **Accept.** Title, one sentence with the folder path, "git found", one button. Theme stays in Settings. | Fewer decisions before lesson 1. |
| 27 | Lesson header metadata | **Accept.** Title only (id is in the breadcrumb). | |
| 28 | Version string on Home | **Accept.** Remove; Settings has it. | |
| 29 | "Done" vs "complete" | **Accept.** "Lesson complete" / "Goal complete" everywhere. | Consistency. |
| 30 | Many small caps labels | **Accept** via the removals above. | |
| 31 | Editor sheet only with a graph | **Accept.** Render over the centre column. | Robustness. |

Questions:
- Q2 "What just happened" visible before doing the task: **Accept** — shown as a collapsed "After you finish" section until the lesson is complete, then open.
- Q3 Steps vs goals: **Keep both** (see 2).
- Q4 Ids on by default: **No** — off by default (4); a setting turns them on.
- Q5 Inspector in sections 1–2: kept; collapsed below 1280px (23).
- Q6 Goal cadence: **Accept** — one quiet line under Goals: "Ticks automatically as you work."
- Q10 Alt-chords vs terminal editors: lessons use the in-app editor; no change.
- Q1, Q7–Q9, Q11: need real-user observation; revisit after testing.

## Round 2 (design review 2, `REVIEW_2.md`)

Owner feedback after using v0.2.0: text size must scale lessons too; navigation confusing; no warning about losing work; both side panels cramped; branch labels crowded; Files/Changes/Areas/.git tabs unclear. Fable's review 2 answered each.

Accepted as specified: items 1–8 (wide lesson panel and drawer instead of inspector; auto-height graph, key popover; inline goals and one-line status bar with Prev/Next; clickable breadcrumb and lesson menu; leave guard with "Save and leave", window close and resumed-lesson notice; branch pills with `HEAD → main`; text size; Changes tab removed, Areas as a centre strip, ".git" renamed "Inside .git"), and P2/P3 items 9–12, 14–23.

Deviations:
- Spacing stays px (Fable 2.1); only text scales. My first pass made spacing rem; reverted.
- The HEAD commit keeps its subject label (moved 4px lower) instead of hiding it; with `LANE 64` and the label at `y+24` nothing overlaps, and the subject is useful.
- Item 13 (one-line summaries on section rows) deferred: needs a summary per lesson.

## Round 3 (`UX_REVIEW_3.md`)

Owner feedback after v0.3.0: settings sheet cramped; lesson panel width followed text size; wanted lesson text and terminal sizes separate; wanted reading and hands-on parts separated (e.g. tabs); hints as a button. All P1–P3 items of `UX_REVIEW_3.md` accepted except P3.15 (interface zoom, only if testers ask). Notably: two text settings (Lessons 13–22px, Terminal and editors 11–20px) with fixed 16px root and px panel widths; lesson tabs Read / Try it (no Goals tab: goals sit with the steps they confirm); actions inline at the step that names them; hint button with a pinned one-at-a-time hint card; recap only on completion; grouped settings with switches, segmented control and steppers.

## Round 4 (owner feedback on v0.4.0, `GRAPH_SPEC.md`)

- Hints become their own tab (Read · Try it · Hints). Each hint is blurred until "Show hint"; showing a later hint shows the ones before it, since hints get more specific. Alt+H opens the tab and shows the next one.
- Graph rebuilt to `GRAPH_SPEC.md`: lane changes are one S-curve centred in a column gap; HEAD is a soft halo plus the `HEAD → name` pill (ring removed, reopening ruling 25); one pill row per commit, beside a tip or above a commit with children, fitted so rows never collide; worktrees as a ⧉ mark on branch pills; subjects cut by measured width. Everything is positioned with SVG transform attributes: CSS transforms on SVG drifted from the edges in WebKitGTK. Deviation: moved nodes no longer slide (only opacity animates); the S-curve and ghost/copy marks carry the "history changed" story.
- Resizing measures once per drag and applies once per frame, with transitions off while dragging.
- Setup shows skeletons; two starts of the same lesson can no longer run setup.sh at once (the "re-init" / "nothing to commit" setup errors), and a folder whose setup never finished is not resumed.
- App icon: a git graph drawn as a tree under a canopy (`assets/icon.svg`).
