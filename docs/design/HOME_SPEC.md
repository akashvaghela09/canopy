# Home screen spec

Design round 5, owner feedback on v1.0.1: "need a better homepage ... something that feels like a learning platform, makes it clear it is a home page with the Canopy name, a mention of a git learning platform, other UI improvements."

Scope: `Home` in `src/components/screens.tsx`, plus brief matching changes to `SectionView`. The top bar and its breadcrumb stay as they are. Everything below uses existing tokens from `src/styles.css`; no new tokens are required (one optional alias is listed in section 9).

## 1. What is wrong with the current Home

Looked at in the browser preview at 1440x900, light and dark, with 0 and 69 lessons complete.

1. **No identity.** The first thing on the page is a card that reads "Section 1 · Orientation". Nothing on the screen says what Canopy is or what the learner is here to do. The only "Canopy" is the 13px breadcrumb in the top bar. It reads as a settings grid, not as the front page of a course.
2. **Fifteen identical squares.** Every section is the same grey card with a title, "Not started" and a progress bar. At 0% that is fifteen empty grey lines, which is exactly the "discouraging 0% bar" ruling 19 removed from the overall progress but kept fifteen times over.
3. **The cards say nothing.** The catalog has a one-line `summary` per section ("Stage, commit, diff and log: the everyday rhythm of git.") and a lesson count, and neither is shown. A beginner cannot tell what "Looking around" or "Detective work" means, nor whether a section is 7 lessons or 27. Long titles truncate ("Configuration and product...").
4. **No sense of a path.** The level labels (BEGINNER, EVERYDAY, ...) are 11px caps and the only structure. Nothing shows that sections are a sequence from first command to internals, or where in that sequence the learner stands.
5. **Flat hierarchy.** Card title, continue title, level heading and progress numbers are all within 13–16px and similar weight. Nothing anchors the eye; the primary action (Continue) is the small dark button at the far right of a wide card.
6. **Dark theme.** `surface` cards on `bg` are low contrast and the progress tracks almost vanish; the grid becomes a field of faint rectangles.
7. **Duplicated numbers.** "Your progress 69 of 225 · 31%" and "5 of 17 complete" sit 60px apart with "Section 6 · Merging" in between acting as a heading for the wrong thing.

What is right and stays: continue in one click; "Start here"/"Next up" wording; left accent border on the current section (ruling 19); no version string (ruling 28); no overall bar at 0% (ruling 19); the `Section ... · lesson` breadcrumb.

## 2. Direction

Home becomes a **course front page with a path**: who you are here (Canopy, learn git by using it), where you are on the path (a 15-node path strip drawn in the app's own graph language), what to do next (one card, one button), and the syllabus (sections as a grouped list with a summary and a count each). Single centred column, no sidebars, no illustrations; the only picture is the app icon and the path strip.

Why a path strip and not more cards: the graph is Canopy's visual language (the icon is a graph, the lesson workspace is a graph). A row of commits with HEAD on "you are here" tells a beginner "this is a sequence and I am at step 6" without a word of copy, and it costs ~15 SVG circles.

## 3. Layout grid

```
window ≥ 1100px wide; the column is centred.

column:      max-width 1120px, padding 0 32px  → content 1056px (1036px at a 1100px window)
vertical:    padding-top 40px, padding-bottom 48px, section gaps as listed
scroll:      the whole <main> scrolls (unchanged)

  y   block
  0   Hero (name, tagline, progress)              height 72
 +32  Path strip                                  height 84
 +40  Up next card                                height 104 (120 for the "new section" state)
 +40  Sections list: 4 groups
        group heading                             height 40  (+16 gap above groups 2–4)
        rows                                      height 56 each, 1px edge divider between rows
 +32  Footer line                                 height 24
```

At 1440x900 the fold (856px of content) ends roughly after the second Beginner row: identity, path, the primary action and the start of the syllabus are all visible without scrolling. At 1100x700 the fold ends just under the Up next card.

Breakpoints: none needed. The row grid uses `1fr` for the title and summary; the summary truncates with an ellipsis. Nothing is hidden at 1100.

## 4. Hero

Not a card: sits directly on `bg`.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [icon 40]  Canopy                                      69 of 225 lessons · 31%│
│            Learn git by using it.                        ▓▓▓▓▓▓▓░░░░░░░░░░░░ │
│            225 hands-on lessons in 15 sections. Every command you type runs   │
│            in real git, right here on your computer.                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Icon: `/icon.svg` at 40x40 (it has its own rounded square), `aria-hidden`. Left column 40px, gap 16px to text.
- "Canopy": `text-2xl` (24px) `font-semibold` `text-fg`, as an `<h1>`.
- Tagline on the same baseline row, 12px to the right of the name: "Learn git by using it." `text-lg` (16px) `text-fg-2`. Same sentence as First run (ruling 26), so the two screens agree.
- Second line, `text-sm` `text-fg-3`, max-width 640px: "{N} hands-on lessons in {S} sections. Every command you type runs in real git, right here on your computer." N and S come from `cat.lessons.length` and `cat.sections.length`, never hard-coded.
- Right block (only when `overall.done > 0`), aligned to the icon's top, width 220px, right-aligned text: "{done} of {total} lessons · {pct}%" in `text-sm text-fg-2 tabular-nums`, then the existing `ProgressBar thick` (6px) underneath with 8px gap. When `done === total`, the text turns `text-success` and reads "All {total} lessons complete". This replaces the old "Your progress" block.
- At 0% the right block is absent (ruling 19); the line and strip carry the "nothing yet" message without an empty bar.

## 5. Path strip

One row of 15 nodes grouped by level, drawn as a tiny commit graph. Full content width, height 84: label row 16, node row 24, number row 16, plus padding.

```
BEGINNER                    EVERYDAY                     INTERMEDIATE                 ADVANCED
●────●────●────●       ●────◉────○────○       ○────○────○────○       ○────○────○
1    2    3    4       5    6    7    8       9    10   11   12      13   14   15
```

Geometry
- Four groups laid out with `grid-template-columns: 4fr 4fr 4fr 3fr`, `gap: 40px`. Inside a group, nodes are spaced evenly (`justify-content: space-between`) with the connector line running through the group's node centres. No connector crosses the 40px gap: the gap *is* the level break.
- Level label: `text-2xs font-semibold uppercase tracking-[0.06em] text-fg-3`, left-aligned above the group's first node.
- Node: 12px circle, 2px stroke. Connector: 2px line, `edge` colour, between adjacent nodes in the same group. Between two *complete* nodes the connector is `success`; otherwise `edge`.
- Number under each node: `font-mono text-2xs text-fg-3`, centred.

Node states (same glyphs as the row leaders in section 7, so the two read as one system)
| state | drawing |
|---|---|
| not started | stroke `edge-2`, fill `surface` |
| in progress, not current | stroke `accent`, fill `surface` |
| current (`nextLesson().section`) | fill `accent`, plus a 24px halo disc behind it in `graph-highlight` (accent at 14%/16%): the same HEAD halo the graph uses |
| complete | fill `success`, no stroke |

Interaction
- Each node is a button, `aria-label="Section {id}, {title}, {state text}"`, `title` with the same text (native tooltip; no custom tooltip component needed).
- Hover: node stroke/fill shifts one step (`edge-2` → `fg-3`; `accent` keeps) and the number under it turns `text-fg`. No motion.
- Click/Enter/Space: `go({ kind: "section", section: id })`.
- Keyboard: the strip is one tab stop with roving `tabindex` (`role="group" aria-label="Learning path"`); ←/→ move between nodes across groups, Home/End jump to 1/15. Focus ring is the global `:focus-visible` outline around the 24px hit area.
- Hit area: 24x24 even though the circle is 12px.

Prefers-reduced-motion: there is nothing animated to reduce. The halo is static.

## 6. Up next card

The only bordered card on the page, so it is the obvious thing to look at. `rounded-md border border-edge bg-surface`, in dark also `dark:border-edge-2`. Padding 20px 24px. Two rows.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ UP NEXT                                        Section 6 · Merging · 5 of 17 →│
│ 6.06  Squash merge                                              [ Continue › ]│
│ Fast-forward and three-way merges, squash merges and conflicts.               │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Eyebrow (left): `text-2xs font-semibold uppercase tracking-[0.06em] text-accent`.
- Section link (right of the eyebrow row): `text-sm text-fg-2 hover:text-fg hover:underline tabular-nums`, a button to the section page. Text: "Section {id} · {title} · {done} of {total}" ("· {total} lessons" when nothing in it is complete), followed by `ChevronRight 14`.
- Title row: lesson id `font-mono text-sm text-fg-3`, 12px gap, lesson title `text-xl font-semibold text-fg` (20px). The primary button is right-aligned on this row: `Button variant="primary" size="lg"`, label as in the table, trailing `ChevronRight 16`. This button is the first focusable element after the top bar, so Tab, Enter is "continue" from the keyboard.
- Third line: the section's `summary` in `text-sm text-fg-2` (we have no per-lesson summary; round 2 item 13 is still deferred). One line, truncates.

States
| state | condition | eyebrow | title | button |
|---|---|---|---|---|
| Not started | `overall.done === 0` | START HERE | 1.01 Meet the terminal | Start |
| In progress | next lesson is in a section with ≥1 lesson complete | UP NEXT | next lesson | Continue |
| New section | `overall.done > 0` and `sectionProgress(next.section).done === 0` | SECTION {prev} COMPLETE · NEXT when section `next.section - 1` is complete, otherwise plain UP NEXT | next lesson | Start section {id} |
| All done | `nextLesson() === null` | ALL LESSONS COMPLETE (in `text-success`) | All {total} lessons complete. | none |

In the "New section" state the third line is replaced by two lines: the new section's summary, then `text-sm text-fg-3`: "{total} lessons in this section." (the card grows to 120px). In the "All done" state the card body is `CheckCircle2 20 text-success` + title, and the line under it reads: "Redo any lesson whenever you like; your progress stays." No button: the list below is the way in.

The old "Your progress" title, the "0 of 7 complete" at card top-right and the "Next up"/"Start here" grey labels are all folded into the above.

## 7. Sections list

A grouped list, not a card grid. Rows have room for a summary and a count, which is what the squares lacked.

```
Beginner   Your first commands, commits, and a safe way to undo.
──────────────────────────────────────────────────────────────────────────────
(✓)  Orientation           Terminal basics, what a repo and a commit are, …   Complete        ›
(✓)  The core loop         Stage, commit, diff and log: the everyday rhythm…  Complete        ›
──────────────────────────────────────────────────────────────────────────────
Everyday   Branches, merges, remotes, and parking unfinished work.
──────────────────────────────────────────────────────────────────────────────
(5)  Branching             Branches, switching, detached HEAD and tags.       Complete        ›
▌(6) Merging               Fast-forward and three-way merges, squash merge…   5 of 17  ▓▓░░░░ ›
(7)  Remotes               Clone, fetch, pull and push with a shared origin…  17 lessons      ›
```

Group heading (height 40, `flex items-baseline gap-3`, bottom border 1px `edge`): level name `text-sm font-semibold text-fg`, then the level blurb `text-sm text-fg-3`. Blurbs are a new `LEVEL_BLURB` map beside `LEVEL_NAMES`:

| level | blurb |
|---|---|
| Beginner | Your first commands, commits, and a safe way to undo. |
| Everyday | Branches, merges, remotes, and parking unfinished work. |
| Intermediate | Rewrite history, recover from mistakes, investigate, and work with a team. |
| Advanced | Configure git, look inside it, and use its specialist tools. |

Row: a `<button>` spanning the full width, height 56, `grid-cols-[32px_minmax(180px,220px)_1fr_120px_96px_16px] items-center gap-4 px-3`, text left-aligned. Rows are separated by 1px `edge` dividers (the group's `<ul>` has `divide-y divide-edge`).

| column | content |
|---|---|
| leader (32px) | 24px numbered node, see below |
| title | `text-sm font-medium text-fg`, one line, no truncation needed at the min width given (longest title "Configuration and productivity" fits in 220px) |
| summary | `section.summary`, `text-sm text-fg-2`, `truncate` |
| state (120px, right-aligned, `tabular-nums`) | not started: "{total} lessons" `text-fg-3`; in progress: "{done} of {total}" `text-fg-2`; complete: "Complete" `text-success` |
| bar (96px) | the existing `ProgressBar` (4px), **only** in the in-progress state; empty cell otherwise |
| chevron (16px) | `ChevronRight 16` in `text-edge-2`, `text-fg-3` on row hover/focus |

Numbered node (the row leader; same vocabulary as the strip):
| state | drawing |
|---|---|
| not started | 24px circle, 1.5px stroke `edge-2`, number inside `font-mono text-2xs text-fg-3` |
| in progress | stroke `accent`, number `text-accent` |
| current section | fill `accent`, number `text-accent-fg`, 2px `border-l-accent` on the row (ruling 19's single cue stays) |
| complete | fill `success`, `Check 14 strokeWidth 2.5 text-surface` |

Hover: `bg-sunken`, chevron darkens. Focus: global focus ring. Active: none beyond hover. Click → section page.

Keyboard: each row is a native button and a tab stop (15 stops; the strip is the fast way to jump). Enter/Space open. No roving tabindex here: a plain list of buttons is what a screen reader expects.

Accessibility: row `aria-label="Section {id}, {title}, {state text}{current ? ', current section' : ''}"` so the summary is not read twice; the node is `aria-hidden`.

## 8. Footer line

One line, `text-xs text-fg-3`, 32px below the list: a ghost-link button "Keyboard shortcuts · Ctrl+/" that dispatches `openShortcuts(true)`. Nothing else: no version (ruling 28), no content version (Settings has both), no last-active date.

Considered and rejected: "Last completed: 6.05 · 3 weeks ago". Factual, but it is the seed of streak-shaming; Settings → Lessons is the place for history if it is ever wanted.

## 9. Colour and theme

All from `styles.css`; light and dark follow automatically.

| element | token |
|---|---|
| page | `bg` |
| hero text | `fg` / `fg-2` / `fg-3` |
| strip connector | `edge`; `success` between two complete nodes |
| strip node not started | stroke `edge-2`, fill `surface` |
| strip node current / in progress | `accent`; halo `graph-highlight` |
| strip node complete | `success` |
| Up next card | `surface`, border `edge` (dark: `edge-2`) |
| eyebrow | `accent`; all done: `success` |
| primary button | `ink` / `ink-fg` (unchanged) |
| group heading rule, row dividers | `edge` |
| row hover | `sunken` |
| state "Complete" | `success` |
| focus | global `focus` ring |

Optional alias for readability: `--color-path-halo: var(--color-graph-highlight)` in both themes. Not required; the graph token is already accent-at-14/16% in both themes and that is the intended "HEAD" meaning.

Dark check: `success` on dark is `#80CD82` (9.1:1 on surface) and `accent` `#55CEC0` (9.1:1), so filled nodes read clearly on `bg`; the `surface` card on `bg` is lifted with the `edge-2` border instead of a shadow.

## 10. Copy, every string

| where | string |
|---|---|
| hero h1 | Canopy |
| hero tagline | Learn git by using it. |
| hero line 2 | {N} hands-on lessons in {S} sections. Every command you type runs in real git, right here on your computer. |
| hero progress | {done} of {total} lessons · {pct}% |
| hero progress, all done | All {total} lessons complete |
| strip group label | Beginner / Everyday / Intermediate / Advanced |
| strip node tooltip / aria | Section {id}, {title}, {state} |
| card eyebrow | START HERE / UP NEXT / SECTION {n} COMPLETE · NEXT / ALL LESSONS COMPLETE |
| card section link | Section {id} · {title} · {done} of {total}   or   Section {id} · {title} · {total} lessons |
| card button | Start / Continue / Start section {id} |
| card new-section line | {total} lessons in this section. |
| card all-done title | All {total} lessons complete. |
| card all-done line | Redo any lesson whenever you like; your progress stays. |
| level blurbs | see section 7 |
| row state | {total} lessons / {done} of {total} / Complete |
| row aria | Section {id}, {title}, {state}[, current section] |
| footer | Keyboard shortcuts · Ctrl+/ |

"Complete", not "Done" (ruling 29). No exclamation marks anywhere.

## 11. Wireframes

### 0% (first visit after the welcome screen), 1440 wide

```
┌ top bar ──────────────────────────────────────────────────────────────────────────────┐
│ ⌂ Canopy                                                                            ⚙ │
├───────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│   [icon]  Canopy   Learn git by using it.                                             │
│           225 hands-on lessons in 15 sections. Every command you type runs in         │
│           real git, right here on your computer.                                      │
│                                                                                       │
│   BEGINNER                 EVERYDAY                INTERMEDIATE            ADVANCED   │
│   ◉────○────○────○         ○────○────○────○        ○────○────○────○        ○────○────○ │
│   1    2    3    4         5    6    7    8        9    10   11   12       13   14  15 │
│                                                                                       │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│   │ START HERE                                      Section 1 · Orientation · 7 lessons → │
│   │ 1.01  Meet the terminal                                            [ Start › ] │ │
│   │ Terminal basics, what a repo and a commit are, and your first look at git.      │ │
│   └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                       │
│   Beginner   Your first commands, commits, and a safe way to undo.                    │
│   ───────────────────────────────────────────────────────────────────────────────────  │
│  ▌(1) Orientation      Terminal basics, what a repo and a commit are, and…  7 lessons  › │
│   (2) The core loop    Stage, commit, diff and log: the everyday rhythm of… 14 lessons › │
│   (3) Looking around   Read history, inspect commits and name them with…   13 lessons › │
│   (4) Basic undo       Restore, revert, reset and clean: take back changes… 13 lessons › │
│                                                                                       │
│   Everyday   Branches, merges, remotes, and parking unfinished work.                  │
│   ───────────────────────────────────────────────────────────────────────────────────  │
│   (5) Branching        Branches, switching, detached HEAD and tags.         17 lessons › │
│   ...                                                                                 │
│                                                                                       │
│   Keyboard shortcuts · Ctrl+/                                                         │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

The (1) node is accent-filled with the halo; everything else is hollow. No progress bar anywhere on the page.

### ~40% (sections 1–5 complete, 6 in progress), 1440 wide

```
┌ top bar ──────────────────────────────────────────────────────────────────────────────┐
│ ⌂ Canopy                                                                            ⚙ │
├───────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│   [icon]  Canopy   Learn git by using it.                  69 of 225 lessons · 31%    │
│           225 hands-on lessons in 15 sections. Every ...   ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░   │
│           real git, right here on your computer.                                      │
│                                                                                       │
│   BEGINNER                 EVERYDAY                INTERMEDIATE            ADVANCED   │
│   ●════●════●════●         ●────◉────○────○        ○────○────○────○        ○────○────○ │
│   1    2    3    4         5    6    7    8        9    10   11   12       13   14  15 │
│                                                                                       │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│   │ UP NEXT                                           Section 6 · Merging · 5 of 17 → │
│   │ 6.06  Squash merge                                              [ Continue › ] │ │
│   │ Fast-forward and three-way merges, squash merges and conflicts.                 │ │
│   └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                       │
│   Beginner   Your first commands, commits, and a safe way to undo.                    │
│   ───────────────────────────────────────────────────────────────────────────────────  │
│   (✓) Orientation      Terminal basics, what a repo and a commit are, and…  Complete   › │
│   (✓) The core loop    Stage, commit, diff and log: the everyday rhythm of… Complete   › │
│   (✓) Looking around   Read history, inspect commits and name them with…   Complete   › │
│   (✓) Basic undo       Restore, revert, reset and clean: take back changes… Complete   › │
│                                                                                       │
│   Everyday   Branches, merges, remotes, and parking unfinished work.                  │
│   ───────────────────────────────────────────────────────────────────────────────────  │
│   (✓) Branching        Branches, switching, detached HEAD and tags.         Complete   › │
│  ▌(6) Merging          Fast-forward and three-way merges, squash merges…  5 of 17 ▓▓░░ › │
│   (7) Remotes          Clone, fetch, pull and push with a shared origin…   17 lessons › │
│   (8) Stashing and…    Park unfinished work and work in two places at once. 10 lessons › │
│   ...                                                                                 │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

`●` filled success, `═` success connector, `◉` accent with halo, `○` hollow. Only the Merging row has a bar.

## 12. Does SectionView need matching changes?

Yes, lightly, so the two screens feel like one product:

1. Eyebrow "BEGINNER · SECTION 2" stays; add the level blurb? No: the section has its own summary line already. Instead make the eyebrow match the Home group heading style exactly (same tokens, which it already does).
2. Progress line: when nothing is complete, show "{total} lessons" instead of "0 of 14 · 0%" plus an empty bar (same rule as Home rows and ruling 19). When complete, keep the bar full in `success` and the "Section complete." line.
3. Add the Up next pattern in miniature: when the section is in progress or not started, a `primary size="lg"` button "Continue" / "Start" to the right of the progress line, opening `nextLesson()` if it is in this section, else the first incomplete lesson of this section. Today the only affordance is the small "Next" word on a row.
4. Lesson rows: unchanged (they already use the ✓ / ○ vocabulary, and the lesson id column is useful there).
5. Reset link at the bottom: unchanged.

## 13. Implementation notes

- All data exists: `cat.sections[].summary`, `cat.lessons.filter(section)`, `sectionProgress`, `overallProgress`, `nextLesson`. The "new section" state is `overall.done > 0 && sectionProgress(cat, next.section).done === 0`; the eyebrow names `next.section - 1` only when `sectionProgress(cat, next.section - 1).state === "complete"` (a learner who jumped around still gets a truthful "UP NEXT").
- Components to add in `screens.tsx`: `PathStrip`, `UpNextCard`, `SectionRow`, `SectionNode` (shared glyph for strip and rows, props `{ id, state, current, size: 12 | 24 }`). No new ui primitives; `Button`, `ProgressBar` and Lucide `Check`, `CheckCircle2`, `ChevronRight` cover it.
- `LEVEL_NAMES` gains a sibling `LEVEL_BLURB` map (copy in section 7).
- The strip's roving tabindex: keep `active` index in state, `tabIndex={i === active ? 0 : -1}`, handle ArrowLeft/ArrowRight/Home/End on the group; focus the node button on change.
- The DESIGN.md 3.3 wireframe should be replaced by section 11 of this file, and UX_DECISIONS.md gets a "Round 5" entry pointing here.
- Preview URLs for checking: `?screen=home&theme=light`, `?screen=home&theme=dark&completed=6.05`, `?screen=home&completed=5.17` (new-section state), `?screen=home&completed=15.18` (all done).
