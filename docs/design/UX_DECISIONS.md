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
