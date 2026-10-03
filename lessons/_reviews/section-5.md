# Review: section 5, Branching (lessons 5.01 to 5.17)

Reviewer: independent senior review, 2026-10-03. No lesson files were edited. Scratch work is in `/tmp/claude-1000/review5/`: alternative solutions in `alt/*.yaml`, results in `results.txt` (live catalog) and `results-fixed.txt` (patched copy), and a patched catalog copy in `lessons/`. Every fix marked "tested" was applied to that copy and run with `canopy-lesson test --lessons /tmp/claude-1000/review5/lessons`. With all tested fixes applied, `test 5` gives 17 tested, 0 failed. Git used: 2.43.0.

## Overall verdict

The section is well built. The two fixtures are deterministic, small and realistic. The text is short, plain, and mostly accurate. Goals use state checks where they can, and sticky goals and expected-failure goals are used correctly. Most alternative approaches I tried pass, and most wrong approaches fail.

Problems, in order:
- **The section no longer passes its own tests (blocker).** Commit questions now accept only hash prefixes unless `allowRefs: true` (`check.rs` around line 100; `LESSON_FORMAT.md` question table). Five reference solutions answer with ref names (`weekend-walks`, `HEAD~1`, `main~2`, `labels`, `notes`), so `canopy-lesson test 5` now reports **17 tested, 5 failed** (5.01, 5.05, 5.08, 5.09, 5.12). The fix is in X1. All five questions should keep the default (`allowRefs` off).
- **The text says deleted or abandoned commits leave the graph. In Canopy they do not (major).** The snapshot adds commits from the HEAD reflog that nothing reaches, and the graph draws them gray (`snapshot.rs` "Reflog-only commits ... as ghosts"; `layout.ts` kind `lost`). 5.11 says three times that the commit disappears, and 5.13's correct answer says it too.
- **Two wrong git facts (major):** 5.07 says `--discard-changes` drops only "every edit in the way" (it drops every local change). 5.11 says a refused `branch -d` prints the commit id (it does not; the successful delete prints it).
- Several `usedCommand` regexes reject natural forms (`git switch -` in 5.07, `git describe HEAD` in 5.15, `--branches` for the graph). Two goals can be passed without doing the step: 5.06 discards an edit that was never made, and in 5.17 `feature/reviews` can borrow the cart commit.

Validate: no errors or warnings for section 5 (the 4 to 8 catalog errors are in sections 12 and 14).

Counts: **1 blocker, 3 major, 10 minor, 23 nit.** (5.11-B, 5.13-A and 5.12-A are instances of X2 and X4 and are not counted twice.)

---

## Cross-cutting

**X1 (BLOCKER). Reference solutions answer commit questions with ref names. These are now rejected.**
Files and lines:
- `5.01/solution.yaml`: `weekend-tip: weekend-walks`
- `5.05/solution.yaml`: `fork-point: HEAD~1`
- `5.08/solution.yaml`: `oldest-main-only: main~2`
- `5.09/solution.yaml`: `merge-base: labels`
- `5.12/solution.yaml`: `main-before: notes`

Why: after the `allowRefs` change, `canopy-lesson test 5` fails these five lessons with "wrong solution answers".
Fix (tested; all 17 pass): use marks, which the checker always accepts.
```yaml
weekend-tip: "@mark:lake"        # 5.01
fork-point: "@mark:gear"         # 5.05
oldest-main-only: "@mark:compost" # 5.08
merge-base: "@mark:watering"     # 5.09
main-before: "@mark:gear"        # 5.12
```
On `allowRefs`, leave it off (the default) for all five commit questions in this section:
- 5.01 `weekend-tip`: with refs allowed, typing the prompt's own word `weekend-walks` is the answer. This is exactly the case the flag exists for.
- 5.12 `main-before`: `notes`, `main~1` or `HEAD~1` would answer it without reading `.git/refs/heads/main`. Reading that file is the point of the question.
- 5.09 `merge-base`: `labels` happens to point at the merge base, so a guess at a branch name passes. `git merge-base` prints a hash anyway.
- 5.05 `fork-point` and 5.08 `oldest-main-only`: `main~1` or `main~2` would show some reasoning, but the graph and `herbs..main` both show ids directly, and reading ids is a skill from 3.06. Keep the rule the same across the section. Optionally add "(type its id)" to the prompts so learners do not try a branch name first.
- Also add a line to `lessons/_notes/section-5.md` (Harness and checker) saying that commit answers in solutions use `@mark:`.

**X2 (major). The graph keeps unreachable commits, drawn gray. The text says they disappear.**
Evidence: `crates/canopy-core/src/snapshot.rs` reads `git reflog -n 50 HEAD` and adds commits that no ref reaches with `reachable: false`. `src/graph/layout.ts` draws them as `lost` nodes (gray, per ARCHITECTURE section 5: "Unreachable commits: gray"). In 5.11, setup made "Try raised beds" while on `experiment`, so the HEAD reflog holds it. I checked: after `git branch -D experiment`, `git log $(git reflog --format=%H -n 50 HEAD) --not --all` lists "Try raised beds". In 5.13, a commit made while detached is always in the HEAD reflog.
Affected text: 5.11 intro, 5.11 "What just happened", 5.11 question option 0, and the correct option of the 5.13 question. Exact replacements are under 5.11-B and 5.13-A.
Why: the learner reads "vanished" and sees a gray dot that is still there. That is the kind of contradiction that undermines the graph as a teaching tool. The real behaviour also teaches more: "nothing reaches it, but it still exists".

**X3 (nit). `requires` leaves out skills that the steps use.**
- 5.04: the steps use `status` ("Confirm with the status") and `log-graph` ("Draw the graph").
- 5.05: the steps use `switch` ("Switch back to main").
- 5.10: the steps use `branch-list` ("List the branches with their tips").
- 5.12 and 5.13: the steps use `commit`.

These skills are all taught earlier, so the validator is fine. Add them, as in section 1-2 review X5.

**X4 (minor). 5.12 depends on the "files" ref backend.**
5.12 (and the last line of 5.14: "tags are tiny files, in `.git/refs/tags`") assume refs are loose files. Git 2.45+ can create repos with the reftable backend, and it is the planned default for git 3.0. In such a repo, `.git/refs/heads` holds no branch files and 5.12 cannot be done. `new_repo` uses the system default.
Fix (tested on 2.43, where the variable is ignored and 5.12 still passes): in `5.12/setup.sh`, before sourcing the fixture:
```bash
export GIT_DEFAULT_REF_FORMAT=files  # keep loose ref files even where reftable is the default
```
Check the variable name against the 2.45 release notes before relying on it. It would be more robust to put this in `setup-lib.sh` `new_repo`, but that is outside this section.

**X5 (nit). The "winter" branch setup is copied word for word in 5.03, 5.06 and 5.07.** A helper in `s05-trail.sh` (for example `add_winter_branch`) would keep the three identical. Not required.

---

## 5.01 What a branch is

**5.01-A (minor). Says the graph draws `HEAD -> main`. It does not.**
File `5.01/content.md`: "The graph draws that chain as `HEAD -> main`."
Why: `GraphView.tsx` draws a "HEAD" text marker on the current branch's flag. `HEAD -> main` is what `git log --decorate` prints in the terminal. The learner is told to look for something the graph does not show.
Fix: "In the graph, the HEAD marker sits on main's flag. In the terminal, `git log` prints the same chain as `HEAD -> main`."

**5.01-B (minor). The "Draw the graph" goal does not need a graph, and it rejects `--branches`.**
File `5.01/goal.json` goal 1: `^git log\b.*--all`. Tested: `git log --all` (no graph) passes. `git log --oneline --graph --branches` fails (5.01-a).
Fix (tested: reference solution and 5.01-a pass, 5.01-wrong fails):
```json
{ "label": "Draw the graph with all branches", "check": { "type": "usedCommand", "matches": "^git log\\b.*(--graph.*(--all|--branches)|(--all|--branches).*--graph)" } }
```

**5.01-C (nit).** `git branch -v --show-current` exits 0 and satisfies both the `-v` goal and the `--show-current` goal, although git ignores `-v` there. Harmless.

## 5.02 Create a branch

No significant findings. Tested: `main~1` and `main` as start points with `commit -a` pass. Creating `signage` with `switch -c` fails, and so does committing before creating the branches.

**5.02-A (nit).** The invalid-name step (`git branch bad..name`) is not checked. If you want it checked, add (untested): `{ "label": "Try an invalid name", "check": { "type": "usedCommand", "matches": "^git branch\\s+\\S*\\.\\.\\S*\\s*$", "exitCode": 128 } }`.

**5.02-B (nit).** It would help to tell learners that `fix/lake-distance` stops them from also having a branch called just `fix` (the name is a folder under `refs/heads`). One sentence is enough: "Because of that, a branch `fix` and a branch `fix/...` cannot both exist."

## 5.03 Switch branches

No significant findings.

**5.03-A (nit).** Setup ran `checkout winter` and then `checkout main`, so `@{-1}` is `winter` at the start. A learner who tries `git switch -` first lands on `winter`. Tested (5.03-a): `switch -`, `switch -`, `switch winter` passes. This is harmless and arguably fine.

**5.03-B (nit).** Without `git switch -` the lesson fails (5.03-b, by design: it teaches `-`). `git switch --no-guess winter` fails "Switch to winter" because the regex is exact. Acceptable.

## 5.04 Create and switch in one step

**5.04-A (nit). The `switch -c` usedCommand goal is loose in two ways.**
- `git branch maps`, then `git switch -c archive/first-trails HEAD~2`, passes all goals (5.04-wrong1). Only one `-c` is needed. This is acceptable, because the second step does use `-c`.
- The regex `^git switch\b.*(-c|--create)` also matches a branch name that contains `-c`, for example `git switch trail-cleanup`. Use `^git switch\b.*\s(-c|--create)(\s|=|$)`.

Tested and passing: `--create` with `main~2`, and `-c` with `HEAD^^`. Wrong start point `HEAD~1` fails.

## 5.05 Commit on a branch

**5.05-A (minor). The graph goal rejects `--branches`** (5.05-c fails). Use the same regex as 5.01-B (tested: 5.05-c passes).

**5.05-B (nit).** The graph goal can be met before the fork exists (drawing the graph first, then committing). It is a usedCommand, and nothing checks order. Acceptable.

Tested and passing: `switch -` with `commit -a` (5.05-a), and committing on main first then `switch -c river HEAD~1` (5.05-b, a valid fork). Committing the river file on main before branching fails, correctly.

## 5.06 checkout, the older command

**5.06-A (minor). "Discard the edit" passes when no edit was made.**
Tested (5.06-noedit): running `git checkout -- gear.md` on a clean tree passes. The destructive step, which is the point of the `-- <file>` row, is never observed.
Fix (tested: reference and 5.06-a pass, 5.06-noedit fails). Insert before the discard goal:
```json
{ "label": "Edit gear.md on winter-gear", "sticky": true, "check": { "type": "all", "checks": [
  { "type": "currentBranch", "name": "winter-gear" },
  { "type": "status", "modified": ["gear.md"] } ] } }
```

**5.06-B (nit).** `git checkout -- .` is rejected by the discard regex (5.06-c). The text says `gear.md`, so this is acceptable. Using switch/restore fails all three checkout goals, correctly.

## 5.07 Switching with uncommitted changes

**5.07-A (major). Wrong description of `--discard-changes`.**
File `5.07/content.md`: "`git switch --discard-changes <branch>` throws away every edit in the way".
Verified: with README.md and trails/lake.md both edited, `git switch --discard-changes main` threw away **both** edits. Only the lake edit was in the way. Untracked files stayed. A learner who trusts the text loses the README edit that the same lesson says "travels".
Fix: "`git switch --discard-changes <branch>` throws away **all** your uncommitted edits to tracked files, not only the ones in the way, and switches."

**5.07-B (minor). Scenario 2 accepts only `git switch main` as the refused command.**
Tested: `git switch -` (5.07-dash) and `git checkout main` (5.07-checkout) are refused in exactly the same way (exit 1), but both fail the goal. `git switch -` is the natural command here: 5.03 taught it, and the learner just came from main.
Fix (tested: both now pass; the reference and the wrong-order run behave as before):
```json
{ "label": "Scenario 2: git refuses to switch to main over the lake edit", "sticky": true,
  "check": { "type": "usedCommand", "matches": "^git (switch|checkout)\\s+(main|-)\\s*$", "exitCode": 1 } }
```

**5.07-C (minor). `switch -m` can leave a conflict, and the lesson does not say so.**
Tested (5.07-merge): `git switch -m main` exits 0 but leaves `trails/lake.md` as "both modified" with conflict markers, and the lesson completes in that state. Conflicts are section 6.
Fix in content: "`git switch -m <branch>` tries to merge your edit into the other branch's version of the file. If both changed the same lines, you are left with a conflict to resolve (section 6)." Optional goal guard (tested: 5.07-merge then fails, all others pass): add `{ "type": "not", "check": { "type": "status", "conflicted": ["trails/lake.md"] } }` to scenario 3. Note that a learner caught in the conflict would need `git restore --source=HEAD --staged --worktree trails/lake.md` to get out. So the content warning matters more than the guard.

**5.07-D (nit). The `any` inside scenario 3 adds nothing.** The second branch (worktree lake.md equals main's version) is true whenever the learner is on main and the edit did not travel. The first branch depends on the word "ice", is case-sensitive, and fails for "- slippery" (which still passes through the second branch, 5.07-commitother). Consider replacing the `any` with the conflict guard above. Leave it as is if you prefer the label's wording.

**5.07-E (nit).** Scenario 1 passes if the learner switches first and then edits README on winter (5.07-wrong passes). The README edit never "travels". Hard to check without command order. Acceptable.

Tested and passing: restore path, `--discard-changes`, committing a non-"ice" line, and the checkout and dash forms (after B).

## 5.08 Compare branches by commits

No significant findings. Counts and markers checked against the fixture: 2, 4, compost, `>`.

**5.08-A (nit).** `git log herbs ^main` and `git log main --not herbs` are rejected (5.08-b). This is fine: the lesson teaches the range syntax. The three-dot form without `--left-right` fails, correctly.

## 5.09 Merged or not

No significant findings in the goals. Tested and passing: `--merged main`, `merge-base herbs main`, plain `diff main...herbs`, `--name-only`, `-a`, `--all`. Using only the two-dot diff fails.

**5.09-A (nit).** Step 3 shows `git diff --stat ...`, and `diff-options` is in `requires`. This technically breaks the recall rule. Fix: "Show a stat diff of `main...herbs`, then of `main..herbs`, and compare which files each lists."

**5.09-B (nit).** "the point where they forked": the merge base is the best common ancestor. After later merges it is not the original fork point. Fix: "...the newest commit that both branches can reach. Here, that is where herbs forked off."

## 5.10 Rename a branch

No significant findings. Tested and passing: two-name `-m`, `--move`, renaming `tmp` while on it, and `-M`. One-argument `-m` used twice fails.

**5.10-A (nit).** Create-copy-then-delete (`switch -c river-walk`, `branch -d new-stuff`, ...) also passes (5.10-copydelete). The end state is the same, so leave it.

## 5.11 Delete a branch

**5.11-A (major). Wrong claim about the refusal message.**
File `5.11/content.md`: "For an unmerged branch git refuses and prints the commit you would lose track of." Hint 1: "for anything else git tells you what you would lose."
Verified (2.43): the refusal prints only `error: the branch 'experiment' is not fully merged.` and a hint to use `-D`. The successful delete prints `Deleted branch experiment (was 819c83e).`, and that is what hint 2 correctly relies on.
Fix: "For an unmerged branch git refuses with 'not fully merged'." Hint 1: "List the merged branches first. `-d` deletes only those; for anything else git refuses with \"not fully merged\"."

**5.11-B (major, instance of X2). The text says the commit leaves the graph.**
Replacements:
- Intro: "If no branch can reach them, they are not shown in the graph any more; they still exist, and section 10 shows how to get such commits back." becomes "If no branch can reach them, the graph draws them gray: nothing points at them any more, but they still exist, and section 10 shows how to get such commits back."
- "What just happened": "Two flags vanished from the graph, and the commit from `experiment` vanished with its flag, because no other label could reach it. The commit object is still on disk." becomes "Two flags vanished from the graph. The commit from `experiment` turned gray: no label reaches it any more, and `git log --all` no longer lists it, but the commit object is still in the repo."
- Question option 0: "It still exists in the repo; only the label pointing at it was removed, so no branch reaches it any more".

**5.11-C (minor). "never deletes commits" is overstated.**
`git gc` prunes unreachable commits once their reflog entries expire (by default after 30 days for unreachable entries, plus the 2-week prune grace period). Fix the last sentence: "Deleting a branch never deletes commits on the spot; it only removes one of the names you had for finding them. Git cleans up commits that stay unreachable only after some weeks."

Tested: `--delete`, `--delete --force`, and `-D pests` all pass. Skipping the `-d` attempt fails, and deleting herbs fails.

## 5.12 Peek inside .git: a branch is a file

**5.12-A (minor, instance of X4).** Reftable. See X4 for the tested setup line.

**5.12-B (nit).** "That happens after `git gc` and in fresh clones." In a fresh clone the local `main` is still a loose file. The remote-tracking refs and tags are what get packed. Fix: "...after `git gc`, and a fresh clone writes most of its refs there."

Tested: `head -1 .git/HEAD` with `commit -a` passes. Committing on `notes` instead of main fails.

## 5.13 Detached HEAD

**5.13-A (major, instance of X2). The correct option describes graph behaviour Canopy does not have, and overstates "only the reflog".**
File `5.13/goal.json`, question `if-switched`, option 0. Replace with:
"No branch would point at it; git warns and prints its id, the graph shows it gray, and only that id or the reflog (section 10) can find it again."

**5.13-B (nit).** `commit` is missing from `requires` (X3).

Tested and passing: `git checkout HEAD~2` with `git branch ideas` (5.13-a), `--detach main~2` ending on `ideas` (5.13-b), and recovery after leaving with `git branch ideas HEAD@{1}` (5.13-recover; a valid rescue, correctly accepted). Creating `ideas` before committing fails "Commit while detached", correctly.

## 5.14 Lightweight tags

No significant findings. The describe failure (exit 128, "No annotated tags can describe ...") matches the text. Tested: `main~2`, `--list`, `show --stat`, and `describe --tags HEAD` pass. An annotated `v0.2` and a wrong commit for `v0.1` fail.

**5.14-A (nit).** "A tag is a name for one commit that never moves." 5.16 then moves one. Use "...that does not move on its own".

**5.14-B (nit).** The `.git/refs/tags` remark depends on the files backend (X4).

## 5.15 Annotated tags

**5.15-A (minor). "Run git describe" rejects `git describe HEAD`.**
Tested (5.15-b fails only that goal). Fix (tested; 5.15-b passes, the lightweight-tag wrong approach still fails the tag goal):
```json
{ "label": "Run git describe", "check": { "type": "usedCommand", "matches": "^git describe(\\s+HEAD)?\\s*$" } }
```

**5.15-B (nit).** The graph marks annotated tags with " ●" and a tooltip (`GraphView.tsx`). Add to "What just happened": "In the graph, `v1.0` carries a dot: that marks an annotated tag."

## 5.16 Move and delete tags

No significant findings. The `fetch` claim is correct (an existing local tag is not overwritten without `--force`). Tested: delete-then-recreate and `-fa ... main` pass. `tag -f v1.0` (lightweight) fails.

**5.16-A (nit).** "The tag object for the old `v1.0` was replaced by a new one" is more precisely put as "`v1.0` now names a new tag object pointing at the right commit; the old one is no longer referenced."

## 5.17 Boss: parallel work

**5.17-A (minor). `feature/reviews` can borrow the cart commit as "a commit of its own".**
Tested (5.17-wrong-reviews-from-wip): `git switch -c feature/reviews wip` with no new commit passes every goal, because `@mark:readme..feature/reviews` contains "Add cart page". The branch also does not start at the tip of main.
Fix (tested: the reference and 5.17-a pass, the wrong run fails). Add to the third goal's `checks`:
```json
{ "type": "not", "check": { "type": "isAncestor", "ancestor": "@mark:cart", "descendant": "feature/reviews" } }
```

**5.17-B (nit).** Hint 3 lists almost every command. That is allowed for a last hint, but it is more than the "goals only" spirit needs. Consider dropping the command list and keeping "name the start commit when you create the branch; tag `main` explicitly if you are not on it". That second point is the real trap: tagging while on `feature/reviews` fails (5.17-wrong-tag), correctly.

Tested and passing: a different order, creating `feature/search` from `old-banner` before deleting it, renaming `wip` while on it, two commits on `fix/typo`, and tagging first.

## Fixtures

`s05-trail.sh` and `s05-garden.sh` are deterministic, minimal, and match their header comments. I checked the garden shape against the questions: merge base `watering`; `main..herbs` = 2; `herbs..main` = 4; merged = labels, main, pests. Marks are set in the right repos. No findings beyond X5.

---

## Alternative-approach tests

"Live" = current catalog. "Patched" = scratch copy with every tested fix above. Files are in `/tmp/claude-1000/review5/alt/`.

| Lesson | Approach | Valid? | Live | Patched |
|---|---|---|---|---|
| 5.01 | reference (answers `weekend-walks`) | yes | **FAIL** (X1) | ok |
| 5.01 | `log --graph --branches`, `--verbose` | yes | **FAIL** (graph goal) | ok |
| 5.01 | `log --graph main weekend-walks` | yes | FAIL | FAIL (accepted limitation) |
| 5.01 | `log --all` without graph, `branch -v --show-current` | no | ok (leak) | FAIL |
| 5.02 | `main~1` / `main` start points, `commit -a` | yes | ok | ok |
| 5.02 | `switch -c signage`, commit there | no | FAIL | FAIL |
| 5.02 | commit first, then branch | no | FAIL | FAIL |
| 5.03 | `switch -` first (lands on winter), `-`, `switch winter` | yes | ok | ok |
| 5.03 | `switch winter`, `switch main`, `switch winter` (no `-`) | no (skips the lesson's command) | FAIL | FAIL |
| 5.03 | `switch --no-guess winter` | yes | FAIL | FAIL (nit) |
| 5.04 | `--create maps`, `-c ... main~2` | yes | ok | ok |
| 5.04 | `-c ... HEAD^^` | yes | ok | ok |
| 5.04 | `branch maps` + one `switch -c` | partly | ok | ok (5.04-A) |
| 5.04 | archive at `HEAD~1` | no | FAIL | FAIL |
| 5.05 | `switch -`, `commit -a` | yes | ok | ok |
| 5.05 | main commit first, river from `HEAD~1` | yes | ok | ok |
| 5.05 | graph with `--branches` | yes | **FAIL** | ok |
| 5.05 | river commit made on main | no | FAIL | FAIL |
| 5.06 | `checkout gear.md` without `--` | yes | ok | ok |
| 5.06 | `checkout -- .` | yes | FAIL | FAIL (nit) |
| 5.06 | discard with no edit made | no | ok (leak) | FAIL |
| 5.06 | switch / switch -c / restore | no (lesson is about checkout) | FAIL | FAIL |
| 5.07 | restore, then switch | yes | ok | ok |
| 5.07 | refusal via `git switch -` | yes | **FAIL** | ok |
| 5.07 | refusal via `git checkout main`, `commit -a` | yes | **FAIL** | ok |
| 5.07 | `--discard-changes` | yes | ok | ok |
| 5.07 | commit a line without "ice" | yes | ok | ok |
| 5.07 | `switch -m main` (leaves conflict) | dubious | ok | FAIL (optional guard) |
| 5.07 | edit README after switching | no | ok (5.07-E) | ok |
| 5.08 | no `--oneline`, `herbs...main` | yes | ok | ok |
| 5.08 | `herbs ^main`, `--not` | yes, other syntax | FAIL | FAIL (accepted) |
| 5.08 | three dots without `--left-right`, wrong answers | no | FAIL | FAIL |
| 5.08 | reference (answers `main~2`) | yes | **FAIL** (X1) | ok |
| 5.09 | `--merged main`, `merge-base herbs main`, plain diff | yes | ok | ok |
| 5.09 | `-a`, `--all`, `--name-only` | yes | ok | ok |
| 5.09 | two-dot diff only, wrong answers | no | FAIL | FAIL |
| 5.09 | reference (answers `labels`) | yes | **FAIL** (X1) | ok |
| 5.10 | `-m old new`, `--move` | yes | ok | ok |
| 5.10 | rename `tmp` while on it, `-M` | yes | ok | ok |
| 5.10 | create copy, then delete the old one | equivalent | ok | ok |
| 5.10 | one-argument `-m` twice | no | FAIL | FAIL |
| 5.11 | `--delete`, `--delete --force` | yes | ok | ok |
| 5.11 | `-D pests` | yes | ok | ok |
| 5.11 | skip the `-d` attempt | no | FAIL | FAIL |
| 5.11 | also delete herbs | no | FAIL | FAIL |
| 5.12 | `head -1 .git/HEAD`, `commit -a` | yes | ok | ok |
| 5.12 | commit on notes | no | FAIL | FAIL |
| 5.12 | reference (answers `notes`) | yes | **FAIL** (X1) | ok |
| 5.13 | `checkout HEAD~2`, `branch ideas` | yes | ok | ok |
| 5.13 | `--detach main~2`, end on ideas | yes | ok | ok |
| 5.13 | leave, then `branch ideas HEAD@{1}` | yes | ok | ok |
| 5.13 | `switch -c ideas` before committing | no | FAIL | FAIL |
| 5.14 | `main~2`, `--list`, `show --stat`, `describe --tags HEAD` | yes | ok | ok |
| 5.14 | annotated v0.2, wrong v0.1 | no | FAIL | FAIL |
| 5.15 | `--annotate --message=` | yes | ok | ok |
| 5.15 | `tag v1.0 -a -m`, `describe HEAD` | yes | **FAIL** | ok |
| 5.15 | lightweight v1.0 | no | FAIL | FAIL |
| 5.16 | `-d` then recreate | yes | ok | ok |
| 5.16 | `-fa ... main`, `--delete` | yes | ok | ok |
| 5.16 | `tag -f v1.0` (lightweight) | no | FAIL | FAIL |
| 5.17 | other order, branch from `old-banner`, rename while on wip | yes | ok | ok |
| 5.17 | `feature/reviews` from wip, no own commit | no | ok (leak) | FAIL |
| 5.17 | tag while on feature/reviews | no | FAIL | FAIL |

`canopy-lesson test 5`: live **17 tested, 5 failed** (X1). Patched copy **17 tested, 0 failed**.

---

## Applied (second pass, 2026-10-03)

At the lead's request, these findings were applied to the live files:
- X1 and all three majors.
- All minors in their tested form.
- The 5.07-D simplification: scenario 3 is now on main + a successful switch + no conflict in `trails/lake.md`.
- Nits X3 (requires), X5 (`add_winter_branch` in `s05-trail.sh`; marks keep the same hashes), 5.02-B, 5.04-A, 5.09-A/B, 5.12-B, 5.14-A, 5.15-B and 5.16-A.

Skipped:
- X4 / 5.12-A: the engine now pins `GIT_DEFAULT_REF_FORMAT=files`.
- 5.02-A: an optional, untested goal.
- 5.17-B: hint wording, which is a matter of taste.
- The nits that propose no change.

Results: `validate` shows no 5.x errors, `test 5` gives 17 ok, and every alternative and wrong approach gives the same result as the "Patched" column above.
