# Graph spec (overhaul, October 2026)

Replaces DESIGN.md section 8 and review-2 item 6 where they differ. Written against the owner's three screenshots (05-21-56, 05-22-45, 05-30-48), `GraphView.tsx`, `layout.ts`, `graph.css`, `GraphPane.tsx` and `styles.css`. The CSS-transform/SVG-coordinate mismatch is a separate bug (the owner is moving everything to SVG `transform` attributes) and is not addressed here; this is the visual and interaction design.

Everything in CSS px at 100% interface size. The graph no longer scales with text size (review 3, item "Graph"): drop the `scale` prop.

---

## 1. What is wrong today, in one paragraph each

**Two signals for one idea.** HEAD is a 2px fg ring at r 11 *and* a pill that says `HEAD → main`. The ring reads as "selected" (it is the same shape as the selection ring, 2px further out), it is the heaviest stroke on the canvas, and its bottom edge sits in the subject text, which is why review 2 had to hide the subject under the HEAD node. The subject of the newest commit is the one the learner most needs.

**Labels live in three systems.** Branch pills beside the tip, pills stacked upward above non-tips (with `+N` beyond two), and worktree HEADs as bare `<text>` centred above the node with a second dashed ring at the *same radius* as the HEAD ring. Screenshot 2 is the result: two bare strings printed on top of each other, two rings coinciding. Worktree HEADs must be pills in the same row as everything else.

**Curves are placed to dodge pills, not to explain history.** `edgePath` puts the lane change at 0.65 of the gap to clear a pill beside the parent. The curve ends up mid-air, far from both nodes (screenshot 3), and the pill it was dodging still sits under the line. The root cause is that a commit with a child in another lane can never have labels beside it: the departing line runs through them.

**Density.** Column 112 for 18 characters leaves 6px between neighbouring subjects; pill bottom is 4px from subject cap height; lane 64 leaves 0px between an above-pill and the upper lane's subject descenders. Every band touches the next.

---

## 2. Geometry

| Name | Value | Notes |
|---|---|---|
| `COL` | **120** (subjects) / **64** (ids) | time axis, one commit per column |
| `LANE` | **68** | lane spacing, main on the bottom lane |
| `R` | **6** | node radius (12px disc) |
| `HALO_R` | **11** | HEAD halo radius |
| `SEL_R` | **10** | selection ring radius, 1.5px |
| `EDGE` | **2** | stroke width, round caps and joins |
| `S` | **40** (COL 120) / **22** (COL 64) | horizontal width of a lane-change curve |
| `PILL_H` | **20** | pill height, `rx` 10 |
| `PILL_PAD` | **8** | horizontal text padding inside a pill |
| `PILL_GAP` | **6** | gap between pills in a row |
| `STUB` | **8** | node edge → first pill (beside), node top → pill bottom (above) |
| `SUBJECT_Y` | **+24** | subject baseline below the node centre |
| `SUBJECT_W` | **COL − 16** | max subject text width (104 / 48) |
| `ABOVE_Y` | **−34 … −14** | pill box of an above-row (bottom 14px over the centre) |
| `PAD_TOP` | **22**, or **44** when any node on the top lane has an above-row | halo + hover scale, or pill + 10 |
| `PAD_BOTTOM` | **36** | subject descender (+27) + 9 |
| `PAD_LEFT` | `max(COL/2 + 8, moreChipW/2 + 12)` | leftmost centred subject or the "earlier" chip |
| `PAD_RIGHT` | `24 + widest beside-row` | so the HEAD row is never clipped |

Graph height `= PAD_TOP + (lanes − 1) · LANE + PAD_BOTTOM`: one lane 58 or 80, two lanes 126 or 148. The pane clamps to `[136, 45%]` as now and vertically centres the SVG, so a one-lane graph in a 136px pane has ~30px of calm above and below.

Vertical budget inside one lane, top to bottom (node centre at 0): upper lane's subject bottom at −41 · 7px gap · above-row pill −34…−14 · stub −14…−7 · node −6…+6 (beside-row pills −10…+10 start at x+15) · 6px gap · subject caps +16, baseline +24, descenders +27 · 9px to the next lane's pill top at +34. Nothing touches.

Node x = `PAD_LEFT + (maxRow − row) · COL`; node y = `PAD_TOP + (lanes − 1 − lane) · LANE`. Draw order (bottom to top): range bands → edges → revert arcs → copy arrows → HEAD halos → nodes → stubs → pills → captions.

---

## 3. Edges: one shape, placed by one rule

Every edge is a single `<path>` from parent centre to child centre, 2px, round caps, drawn under the nodes so the ends are always hidden by the discs. Same lane: `M xp,y L xc,y`.

Different lanes: a straight run on one lane, one S-curve of width `S` centred in a column gap, a straight run on the other lane. The S is a cubic with horizontal tangents at both ends:

```
gc = gap centre x                       (= x_left_node + COL/2)
M xA,yA  L gc−S/2,yA  C gc,yA gc,yB gc+S/2,yB  L xB,yB
```

Which gap:

- **First-parent edge** (branch-off; also the only edge of a plain commit): the gap **immediately right of the parent**. The run is on the child's lane, which the lane allocator keeps free between those columns.
- **Second and later parents** (merge-in): the gap **immediately left of the child**. The run is on the parent's lane, reserved by the allocator for exactly this.
- A merge whose extra parent is on main (merging main into a feature) runs along main's lane; if main has advanced past that parent, the run coincides with main's own line for a stretch. Known compromise; keep.
- Edges into the **"earlier commits" chip** follow the first-parent rule (S right of the chip).

The S always sits in a gap, never through a column, so it can never cross a subject (subjects span at most ±52 around a node; the S spans gc ± 20 = x+40…x+80). A lane change over k lanes is still one cubic over k·LANE: steep in the middle, which is right, it says "jumps straight up".

Colours: first-parent edge = child's owner colour (so a feature's colour visibly peels off main); merge-in edge = parent's (source) colour; ghost edges `--color-graph-ghost` 1.5px dashed `4 3` at 0.6; lost edges `--color-graph-unreachable` 2px solid; copy arrow `fg-3` 1.5px dotted `1.5 3` with a 6px open arrowhead, only while the ghost or its copy is hovered or selected (ruling 5); revert arc `fg-3` 1.5px dashed `4 3` (section 8).

---

## 4. Nodes

| Kind | Drawing |
|---|---|
| commit | disc r 6, fill owner colour, no stroke |
| merge | disc r 6 + inner ring r 3, 2px stroke in `--color-canvas` (reads as a double circle) |
| ghost (rewritten, copy exists) | hollow r 6, 1.5px **dashed** `3 2.5` in `--color-graph-ghost`, opacity 0.6 |
| lost (unreachable, no copy) | disc r 6, fill `--color-graph-unreachable` |
| earlier-commits chip | pill 20 tall, `--color-sunken` fill, no border, text `N earlier commits` 11px mono 400 `fg-2`, centred on the chip's column at lane 0; lines end at its centre, behind it; click expands by 20; tooltip "N older commits are not drawn" |

**HEAD** (new): no ring. The HEAD commit gets a **halo**: a disc r 11 in the node's own colour at `--graph-halo-alpha` (**0.18** light, **0.28** dark), under the node. Soft, clearly "you are here", never mistaken for selection, and it does not touch the subject. The pill (`HEAD → main` or `HEAD`) carries the word; the halo carries the position. This reopens ruling 25 and review-2's "ring stays"; the reason is above (ring = selection shape, ring bottom in the subject, two signals for one fact). The halo moves with the node (translate) and cross-fades (opacity, 200ms) when HEAD moves to another commit. Only the terminal's HEAD gets a halo; other worktrees are shown on their branch pills (section 5).

**Selected**: 1.5px ring r 10 in `--color-fg` (sits inside the halo if both). **Hover**: node group scales 1.2 (transform, 120ms), cursor pointer, tooltip `abc1234 · subject · author · date` via `<title>` as now. Invisible hit disc r 12.

**Subject under the node**: `--font-sans` 11px (0.6875rem), `fg-2`, centred on x, baseline y+24, truncated **by measured width** to `COL − 16` with `…` (not by character count; "Fix price roundin…" is a count artefact). Ghost/lost subjects in `fg-3`. Ids mode: 7-char id, `--font-mono` 11px `fg-3`, same baseline. Subjects are always drawn, including under the HEAD node. Because `SUBJECT_W < COL`, neighbours can never collide and no avoidance logic is needed.

---

## 5. Labels (pills)

One pill family, 20 tall, `rx` 10, padding 0 8, `--font-mono` 11px, gap 6. Every pill has a **2px stroke in `--color-canvas` painted behind its fill** (a halo), so on the rare occasions a line passes behind a pill it reads as "behind", not "through".

| Label | Fill | Stroke | Text | Notes |
|---|---|---|---|---|
| local branch | branch colour | none | `name`, 600, `--color-graph-label-fg` | |
| current branch (HEAD attached) | branch colour | none | `HEAD → name`: `HEAD →` 500, `name` 600 | git's own wording; always first in the row |
| detached HEAD | `--color-ink` | none | `HEAD`, 600, `--color-ink-fg` | solid dark = "HEAD, on its own"; always first; the banner chip explains |
| branch checked out in another worktree | branch colour | none | `name` 600 + **⧉ glyph** after it | glyph: two 7×7 squares (rx 1) offset (2, −2), 1.25px `label-fg`; tooltip "Checked out in ../<folder>. That folder's HEAD points here." |
| remote-tracking | none | 1.5px **dashed** `3 2` in the local branch's hue | `origin/` 400 + `name` 600, in the hue | placed directly after its local branch's pill when both are on this commit |
| tag | `--color-canvas` | 1px `--color-edge-2`, **rx 4** | lucide `tag` 10px then `name` 500 `fg` | lightweight = outlined icon; annotated = filled icon (`fg-2`); tooltip explains the difference |
| bisect | `--color-canvas` | 1.5px state colour, rx 4 | `good`/`bad`/`skip` 500 in success/danger/`fg-3` | |

Order within a row: HEAD pill (attached or detached) · other local branches A→Z, each followed by its remote · remaining remotes · tags · bisect. Stashes are never pills (section 9).

Three screenshot-2 pills become `[HEAD → main] [review ⧉] [scratch ⧉]` in one row. No bare text, no second ring.

### 5.1 Placement: beside or above, decided by children

**Beside** (the normal case): a commit with **no visible children** (nothing later points at it, in any lane) gets its row at node level, right of the node: stub 2px from x+7 to x+15 in the first pill's colour (ink for detached HEAD, `edge-2` for a lone tag), first pill at x+15, box y−10…y+10. The row may be as wide as it likes; the canvas grows (`PAD_RIGHT`) and auto-pan keeps the HEAD row in view.

**Above**: a commit **with children** (a branch point, a merged branch's last commit, `origin/main` behind `main`, a tag on an old commit) gets one horizontal row above it, box y−34…y−14, with a 2px stub from y−7 to y−14 at x in the first pill's colour. This is the only rule a learner has to absorb: *a name sits at the end of its line; when the line goes on, the name hangs over its commit.*

Why not beside for branch points: the departing line leaves the node horizontally and rises in the next gap; a pill beside it would sit on that line (screenshot 3 is this case). Why not always above: the newest commit's row (`HEAD → main`, `origin/main`, a tag) is the widest row in the graph and often wider than a column; beside, it has unlimited room.

### 5.2 Above-row fitting (no collisions, ever)

Per lane, visit nodes left to right. For a node at x with an above-row of natural width W:

1. **Allowed span.** Start with `[x − COL/2 − 12, x + COL/2 + 12]`. Shrink the right end to `gc − S/2 − 4` (= x+36) if an S-curve occupies the right gap at this lane's band; shrink the left end to `gc + S/2 + 4` (= x−36) for the left gap. Shrink the left end to `prevRowRight + 6` if the previous node in this lane has a row; otherwise to `x_prev + 16` (never hang over another commit's centre). An S "occupies" a gap at this band if it runs between lanes a and b with a ≤ lane < b.
2. **Place.** Centre the row on x, then clamp into the span. The stub stays at x; a row may be off-centre; that is what the stub is for.
3. **Shrink if needed**, in this order: collapse to `[first pill] [+N]` (`+N` is a tag-style pill, tooltip lists the hidden names); then truncate the first pill's text with `…` to fit, never below 8 characters of the name. If it still does not fit, **let it overflow symmetrically over the S** (the line passes behind the halo'd pill). A readable name beats a clean line; an overlap with a *neighbour's row* is never allowed, the neighbour collapses first.

With COL 120 this almost never triggers: `main` is 46px, `origin/main` ≈ 90, `HEAD → main` ≈ 96 and fits `[x−72, x+36]`. With COL 64 (ids) collapsing is frequent and acceptable; ids mode is a density choice.

### 5.3 Worst cases, stated

- Merge commit that is also a branch point, with labels: S on both sides, span 72px; `main` fits, `HEAD → main` overflows one S by ~12px behind the pill halo. Rare, accepted.
- A branch-off from lane 0 to lane 2 passes lane 1's band in that gap; a lane-1 row there obeys rule 1 (the span shrinks). A lane-1 *beside*-row there (tip exactly one column left of the climbing S) is crossed behind the pill. Very rare, accepted.

---

## 6. Colours

Keep the eight-hue palette, `--color-graph-main`, `-unreachable`, `-ghost`, `-highlight`, `-label-fg` as they are. Changes:

- **Remove `--color-graph-head`** (the ring is gone).
- **Add** `--graph-halo-alpha: 0.18` (light) / `0.28` (dark).
- Detached HEAD pill uses `--color-ink` / `--color-ink-fg`.
- Tag pill uses `--color-canvas` + `--color-edge-2`; earlier-commits chip uses `--color-sunken`.
- Pill halo stroke = `--color-canvas`.

Contrast already verified in `styles.css` (label-fg on 50% L hues ≥ 5.4:1 light; dark text on 78% L hues ≥ 8.7:1 dark). `fg-2` subjects 7.4:1 / 7.8:1 on canvas.

---

## 7. Worktrees, detached HEAD, many labels on one commit

- The halo marks the terminal's HEAD only (`snapshot.head`). Other worktrees' HEADs appear as ⧉ on their branch pill; a detached HEAD in another worktree is an **outlined** ink pill `HEAD ⧉` (1.5px `fg-2`, text `fg`), the only outlined solid pill, reserved for "a HEAD that is not yours".
- Detached HEAD on a non-tip (`git checkout HEAD~2`): above-row `[HEAD]` with stub + halo + the existing floating warning chip.
- Detached HEAD on a tip that also has branches: `[HEAD] [main]` beside, HEAD first (ruling 25 kept: HEAD stays on the HEAD node).
- Key popover gets a line: `⧉ checked out in another folder (worktree)`.

---

## 8. Revert, bisect, highlights, ghosts

- **Revert**: quadratic arc above the lane from `(x_revert, y−8)` to `(x_target, y−8)`, control `(mid, y − 8 − 2·lift)`, `lift = clamp(14 + |dx|/6, 24, 40)`; label `undoes` 10px mono `fg-3` at the apex with `paint-order: stroke; stroke: var(--color-canvas); stroke-width: 3`. Drawn under pills.
- **Bisect**: badges in the row as above; the commit under test gets the selection ring.
- **Range highlight / merge base**: unchanged from DESIGN.md 8 (band radius 10 in `graph-highlight`, diamond on request only).
- **Ghost lane caption** (review 2, item 20, kept): `old commits (no branch points here)` 10px `fg-3`, right-aligned to `x_leftmostGhost − 16` at that lane's y, only when the lane holds nothing but ghost/lost nodes.

---

## 9. Pane, stashes, empty and tiny states

- Pane: unchanged height rule; no header for single-repo lessons; floating chips top-left; Key button top-right (popover entries in section 11).
- **Stashes** stay in the 28px bottom strip, never on the canvas (they are "parked" by definition). Hovering a stash card draws a 1px dotted `fg-3` leader from the card to its base commit (opacity fade 120ms).
- **Empty**: one row, centred: `CircleDashed` 20px `edge-2` · "No commits yet — your first commit will appear here." 13px `fg-3`. Fits 136px.
- **Tiny** (136px, one lane): graph height 58 (or 80 with an above-row) centred; subjects visible; the HEAD row has full width. Two lanes still fit (126 / 148 → the pane grows to 148).
- Auto-pan: `scrollLeft = headX + headRowWidth + 24 − clientWidth` when the row is off-screen right, or `headX − PAD_LEFT` when off-screen left, smooth unless reduced motion.

---

## 10. Motion (transform and opacity only)

| Event | What moves | How |
|---|---|---|
| new commit | node group + its subject | scale 0.6→1 and opacity 0→1, 200ms `--ease-out` |
| node changes column/lane (rebase, collapse, expand) | node group, its pill rows, halo | translate, 320ms `--dur-graph` |
| branch pill moves (`reset`, `commit` on a branch, fetch moving `origin/main`) | the pill row group | translate from the old node to the new, 320ms; rows that switch beside↔above translate too |
| HEAD moves | halo | opacity out on the old node, in on the new, 200ms; no translate (a sliding halo suggests a commit moved) |
| edge appears or changes shape | the path | opacity 0→1, 200ms; old path removed instantly (paths are keyed by endpoints; `d` is never animated) |
| commit becomes ghost/lost | node | opacity cross-fade of the two drawings, 200ms |
| copy arrow | group | opacity, 200ms, on hover/select only |
| pane height | section | `height` 240ms (the one permitted layout animation, as before) |
| hover | node group | scale 1.2, 120ms |

Reduced motion: translates and scales instant, fades 80ms (as the tokens already do).

---

## 11. Key popover (replace the list)

1. `●` a commit; its message is under it
2. soft glow: HEAD, the commit you are on
3. `[HEAD → main]` you are on branch main
4. `[origin/main]` dashed: the remote's copy, as of your last fetch
5. `[⌂ v1.0]` a tag (filled icon: annotated)
6. `⧉` checked out in another folder (worktree)
7. grey: on no branch · dashed circle: replaced by a newer copy
8. `→` time runs left to right

---

## 12. Sketches (not to scale; `(●)` = halo'd HEAD node, `┃` = stub)

**A. Linear history, HEAD on main, origin/main and a tag on the tip (one lane, graph height 58)**

```
   ●─────────────●─────────────(●)━[HEAD → main][origin/main][⌂ v1.0]
 Add README    Add todo list   Fix typo in…
```

**B. Feature branched from main's tip, two commits on it, HEAD on the feature.** `main` has a child, so it hangs above; the S sits in the gap right of `Add cart`, the feature colour peels off main.

```
                        ╭──────────●──────────────(●)━[HEAD → checkout]
                        │   Add checkout page   Fix price rounding
          [main]        │
            ┃           │
   ●────────●───────────╯
 Add product list   Add cart
```

**C. Two worktrees and two tags on one commit (screenshot 2 redone).** One row; the ⧉ glyph says the other folders are here; only one halo.

```
   ●─────────────●─────────────(●)━[HEAD → main][review ⧉][scratch ⧉][⌂ v1.0][⌂ rc1]
 Add planner…   Add week view  Add notes
```

**D. (bonus) `origin/main` two behind `main` after local commits** — above-row on a non-tip, no fitting needed.

```
               [origin/main]
                     ┃
   ●─────────────────●─────────────●─────────────(●)━[HEAD → main]
 Add README       Add todo…     Add dates      Fix typo in…
```

**E. (bonus) Feature merged into main, HEAD on main.** `checkout` has a child (the merge), so it hangs above; the merge-in S is in the gap left of the merge node, in the feature colour.

```
          [checkout]
             ┃
        ╭────●─────────────────╮
        │  Add checkout page   │
   ●────●─────────────●────────◎━[HEAD → main]
 Add… Add cart     Fix prices   Merge branch 'checkout'
```

---

## 13. Remove

- The HEAD ring (`r R+5`, 2px) and `--color-graph-head`.
- `extraHeads` rendering: the dashed worktree ring and the `HEAD · name` `<text>`.
- The upward **stack** of above-labels and its `+N` after two; replaced by one row with fitting (5.2).
- The `isTip` test "nothing later in this lane"; replaced by "no visible children" (5.1).
- `edgePath`'s `mid = x ± COL·0.65` and 14px handles; replaced by the gap-centred S of width `S` (3).
- Character-count truncation (`SUBJECT_CHARS`); measured width instead.
- Hiding the subject under the HEAD node.
- The tag polygon (pointed left end); icon pill instead.
- The outlined detached-HEAD pill; ink-filled instead. Outlined-solid is now reserved for another worktree's detached HEAD.
- The `scale` prop and all `* scale` geometry.
- `.g-head` CSS class (unused after the ring goes).

## 14. What the layout should hand the renderer

Per node: `labelPlacement: "beside" | "above"`, `rowOffsetX` (row's left edge relative to x), `rowItems` after collapsing/truncation (with full names for tooltips), `isHead`, `otherWorktrees: string[]`. Per edge: the gap index of its S (or none) and which lane it runs on, so obstacle tests in 5.2 need no geometry in the renderer. Both are pure functions of the layout and the two constants `COL`, `S`; keep them in `layout.ts` so they are unit-testable without the DOM.
