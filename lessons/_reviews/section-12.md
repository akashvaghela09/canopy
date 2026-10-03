# Review: section 12, Workflows (lessons 12.01 to 12.13)

Reviewer: independent senior review, 2026-10-03, against git 2.43.0 (app minimum 2.32). No lesson files were edited. Every fix marked "tested" was applied to a scratch copy (`/tmp/claude-1000/review12/lessons`). That copy validates with no errors (225 lessons, 0 errors, 29 warnings, all shell-check warnings from section 15), passes `canopy-lesson test 12` (13/13), and gives the "Fixed" column in the table at the end. Alternative and wrong-approach solutions are in `/tmp/claude-1000/review12/*.yaml`.

## Overall verdict

A solid, realistic section. The shared "Lantern" fixture (`_lib/fixtures/s12-team.sh`) is small, deterministic and reads like a real project. The workflow advice is mostly accurate and, importantly, not dogmatic: 12.03 frames "rebase private, merge shared" as "the rule most teams use", 12.07 says Gitflow is heavy for continuous deployment, and 12.09 offers cherry-pick or merge. Goals are state-based almost everywhere and accept most reasonable routes: squash, rebase+ff and direct `push branch:main` in 12.06; merge or rebase in 12.11; amend, new commits or autosquash in 12.04 and 12.05; `pull` or `reset --hard` in 12.12; squash, ff or no-ff in the boss.

Live: `validate` shows no section-12 issues. `test 12`: 13 tested, 0 failed. I ran 58 alternative and wrong-approach solutions. Valid routes that fail today: 12.02 (2), 12.07 (2), 12.09 (1), 12.10 (1). Wrong routes that pass today: 12.04, 12.05, 12.06, 12.10 and 12.11 (one each).

Main problems:
- **12.10's action re-breaks `main` if pressed again after the restore.** After protection is on, the same press fails with a raw git error. (major, tested fix)
- **12.11 has a trap.** The unstaged README edit waits on `narrow`, but step 1 sends the learner to `wide`, and the edit goes with them. A `commit -a` while resolving the merge puts it into `wide`, and it is gone from `narrow`. (major, tested)
- **12.03's "Fetch" goal passes at the start**, because setup already fetched into `work`. (major, tested)
- **12.09 bundles the fix and the version bump in one commit, then cherry-picks it onto `main`.** That gives `main` `VERSION 1.0.1`. Step 4's wording ("without bringing the version bump logic into question") hints that the author noticed the problem. (major)

Counts: **0 blocker, 4 major, 15 minor, 13 nit.**

Engine notes: marks from actions are now visible to checks, and goals are re-checked after actions. Nothing in this section depends on either limitation any more. Only the author's notes are out of date (X1).

---

## Cross-cutting

**X1 (nit). Author notes describe engine gaps that no longer exist.** `lessons/_notes/section-12.md`, "Format gaps", bullets 1 and 2 ("Marks from actions are invisible to checks", "No goal evaluation right after an action"). Fix: replace both bullets with: "Marks written by actions are visible to checks, and goals are re-checked after each action (engine change, 2026-10-03). 12.06 and 12.10 still check by content and by `refNotAt`, which works either way."

**Fixture `_lib/fixtures/s12-team.sh`: no findings.** Deterministic (fixed `at` before each commit). The `base` mark is correct. It leaves `work` on a clean `main` that tracks `origin/main`. `teammate` is the original repo rather than a clone, but it has `origin` and upstream tracking set, so it behaves like Sam's clone.

**Actions pressed twice or early.**
- 12.06: both actions are idempotent. Pressing both at the start, or each one twice, works (`06-a1`, `06-a2`).
- 12.10: not safe; see 12.10-A.
- No other lesson has actions.

---

## 12.01 One branch per task

**12.01-A (minor, dogma).** `content.md` step 5 of the rhythm ("Merge it into `main` with a merge commit, so the graph keeps the shape of the task.") follows "Most teams work the same way". Many teams squash or rebase at that step, and 12.06 teaches exactly that. Fix: after the sentence "A branch that is deleted after merging is not lost: its commits are in `main`. ..." add:
> Some teams squash or rebase at step 5 instead of making a merge commit (12.06 shows that style). The cycle is the same.

Goals: robust. Merge with `--no-ff`, deleting with `-D` or a `:branch` refspec, and publishing after the merge all pass. A fast-forward merge and skipping the publish both fail, as they should.

## 12.02 Pull requests, without a platform

**12.02-A (minor, goal too strict).** `goal.json`, goal "Produce the request with git request-pull": `"^git request-pull\\s+main\\s+\\S+\\s+import-csv"` rejects `git request-pull origin/main origin import-csv`, a natural base for a request (`02-a1`). It also rejects `git request-pull -p main origin import-csv`, the documented patch option (`02-a3`). Fix (tested):
```json
"matches": "^git request-pull(\\s+-p)?\\s+(origin/)?main\\s+\\S+\\s+import-csv(:import-csv)?\\s*$"
```
The default `exitCode: 0` still requires the branch to be pushed first: request-pull exits 1 with "Are you sure you pushed 'import-csv' there?" (`02-w1`). Leaving out `<end>` also exits 1 on 2.43 (`02-a4`), so it is correctly not accepted.

**12.02-B (nit).** `content.md`, "What just happened": "The summary lists the branch's commits, a shortlog by author and a diffstat, exactly what a review page shows." The commits *are* the shortlog. Replace with: "The summary names the base commit, where to fetch from, a shortlog of the branch's commits by author, and a diffstat: the facts a review page shows."

**12.02-C (nit).** Question `new-file`: add `"./src/export.js"` to `accept`.

Questions verified on the real repo: 2 commits, `src/export.js`, not merged.

## 12.03 Keep your branch up to date

**12.03-A (major, passes at start).** `setup.sh` ends with `goto work`, `git fetch -q origin`, `git switch -q main`. So `origin/main` already sits at `@mark:main-tip`, and the goal "Fetch Sam's commits so origin/main is current" is ticked at the start (`test -v` reports it in "passing at start"). Step 1 then has nothing to do. The pre-fetch also puts Sam's `export-pdf` commit in place already. Fix (tested): delete the line `git fetch -q origin` from the final block, leaving:
```bash
goto work
git switch -q main
```
With that change the reference solution and the `03-a1` and `03-a3` routes still pass, and nothing passes at the start. `03-a2` now fails because it never fetches, which is correct.

**12.03-B (nit, accuracy).** `content.md`: "`--force-with-lease`, which refuses to overwrite anything you have not seen". More precisely: "which refuses if origin's copy has moved since you last fetched it". This matters because a background fetch defeats the lease, as 9.26 teaches. Optional.

Goals otherwise robust:
- Rebasing `export-pdf` fails (`03-w1`).
- `push -f` fails (`03-w2`).
- Merging `main` into `tags-ui` fails (`03-w3`).
- Merging `origin/main` first and then `origin/export-pdf` passes.

## 12.04 Review your own work first

**12.04-A (minor, passable by wrong approach).** Goal "Compare old and new branch with range-diff" is a bare `usedCommand`. Running range-diff *before* fixing anything (when it shows nothing useful) satisfies it (`04-w1` passes live). Fix (tested; the reference, `04-a1` and `04-a2` pass, `04-w1` fails):
```json
{
  "label": "After fixing, compare old and new branch with range-diff",
  "sticky": true,
  "check": { "type": "all", "checks": [
    { "type": "usedCommand", "matches": "^git range-diff\\b", "last": true },
    { "type": "refNotAt", "ref": "feature/reminders", "target": "origin/feature/reminders" }
  ] }
}
```
(A learner who pushes before running range-diff would fail this. The lesson says it stops before pushing, and after a push the suggested `origin/feature/reminders` comparison shows nothing anyway.)

**12.04-B (nit).** "The feature itself is still there" passes at the start. It is a guard, so that is acceptable. It could be folded into the DEBUG goal so the checklist shows nothing ticked at the start.

The question (4 files) is correct. New-commit, amend, `edit` rebase and `--fixup` + autosquash routes all pass.

## 12.05 Commits worth reading

**12.05-A (minor, passes at start).** Three of the five goals are ticked before the learner does anything:
- "exactly three commits": the branch already has three.
- "One commit adds only src/config.js ... 100": the "fix" commit touches only `src/config.js` and has 100.
- "One commit adds only test/config.test.js": "more".

They cannot all pass together, but a checklist that starts three-fifths done misleads.

**12.05-B (minor, wrong approach passes).** The content asks for "an order that makes sense", but tests-before-module passes (`05-w2`).

Fix for both (tested; the reference, `05-a1` reset-and-recommit and `05-a2` edit+fixup rebase pass, `05-w1`, `05-w2` and `05-w3` fail, and only the clean-tree guard passes at the start). Full file: `/tmp/claude-1000/review12/lessons/12.05/goal.json`.
- Goal 1 becomes `all[ commitCount main..cleanup == 3, not commitMessage(rev) matches "^(stuff|more|fix)$" for rev in cleanup, cleanup~1, cleanup~2 ]`, with the label "cleanup has exactly three commits on top of main, none of them still called stuff, more or fix".
- In the config goal, each position `k` gains `{ "type": "fileInRev", "rev": "cleanup~k~1", "path": "src/config.js", "present": false }`, so the commit must *add* the file. Label: "One commit adds src/config.js and nothing else, already with DEFAULT_LIMIT = 100".
- In the test goal, each position gains `{ "type": "fileInRev", "rev": "<that rev>", "path": "src/config.js", "present": true }` (order) and `{ "type": "commitMessage", "rev": "<that rev>", "matches": "^[A-Z]" }`. Label: "One commit adds only test/config.test.js, after the config module, with a proper subject".

**12.05-C (nit).** Hint 1: "reset it softly away" reads oddly. Replace it with: "Start an interactive rebase onto main and mark the first commit for editing. When it stops, undo that commit but keep its changes, then commit README.md and src/config.js separately."

Content accuracy is good: imperative mood, 50 characters and a body explaining why are presented as "the convention most projects use", not as law.

## 12.06 Trunk-based development

**12.06-A (minor, label not checked).** The final goal's label says "no task branches left", but nothing checks it: the reference solution without its `branch -D` lines passes (`06-w3`). Branch names are the learner's choice. After a squash merge, though, any leftover task branch has commits that are not in `main`. Fix (tested; all valid routes pass, `06-w3` fails): add to that goal's `checks`
```json
{ "type": "commitCount", "range": "--branches --not main", "equals": 0 }
```
With the rebase+fast-forward route, a leftover branch is already merged and not caught. That is acceptable.

**12.06-B (minor, accuracy).** `content.md` says: "Before you integrate, pull with fast-forward only; if that refuses, someone pushed first and you update your change, not `main`." If you pull before integrating, your `main` has no local commits, so a fast-forward-only pull cannot refuse. The real signal that someone pushed first is a rejected *push*. Replace the bullet with:
> - `main` moves only forward in a straight line. Right before you integrate, update `main` with a fast-forward-only pull, so your change lands on the newest trunk. If your push is then rejected, someone pushed first: put your commit on top of the new `origin/main` and push again. Never merge.

Also change "Two rules keep the trunk readable:" to "Teams that work this way usually add two rules:". One commit per task is a team convention, not part of the definition of trunk-based development.

**12.06-C (minor, unexplained refusal).** After a squash merge, `git branch -d` refuses ("not fully merged"); the reference solution uses `-D`. Content step 1 just says "Delete the branch." Replace hint 2 with:
> If the push is rejected, Sam got there first. A fast-forward-only pull refuses now, because your commit is already on `main`: rebase `main` onto `origin/main` (or pull with rebase) and push again. After a squash merge git calls the task branch unmerged, so delete it with `-D`.

**12.06-D (nit, accepted).** Making all three squash commits locally and pushing once at the end passes (`06-w2`), which goes against "integrate frequently". Enforcing the interleaving (Sam's commits at `main~1` and `main~3`) would punish early button presses, so I would leave it.

Actions: idempotent. Early, out-of-order and double presses all work (`06-a1`, `06-a2`, `06-a3`). Valid routes tested: squash; rebase + `merge --ff-only`; `push origin t3:main` after a rejected push and a rebase. A `--no-ff` merge fails (`06-w1`).

## 12.07 Gitflow

**12.07-A (minor, valid route fails).** The goals read `release/1.1.0` by name, and the release goal is not sticky. Deleting the release branch, which `git flow release finish` and the lesson's own "What just happened" both suggest, makes three goals fail if it happens before the last step. For example: merge into `main` and into `develop`, delete, then tag (`07-a2`). Deleting after the tag (`07-a1`) passes in the app, which latches completion, but not in the harness. Fix (tested; `07-a1` and `07-a2` pass, `07-w1` and `07-w2` still fail):
- Release goal: add `"sticky": true`.
- `main` goal: replace `{ "type": "isAncestor", "ancestor": "release/1.1.0", "descendant": "main" }` with `{ "type": "fileInRev", "rev": "main", "path": "src/login.js", "present": true }`.
- `develop` goal: replace `{ "type": "isAncestor", "ancestor": "release/1.1.0", "descendant": "develop" }` with `{ "type": "isAncestor", "ancestor": "main^2", "descendant": "develop" }`. `main^2` is the release tip merged into `main`, whatever order the two merges happened in.

**12.07-B (nit, accuracy).** "What just happened" says "`main` has two points, both tagged". `main` has three commits plus the merge, and the first commit is untagged. The first bullet ("Every commit on it is a release") is also not true of this setup. Replace them with:
- "`main` holds released versions only. Each merge into it is a release, marked with a tag."
- "Watch the lanes in the graph: `main` has gained one merge commit, tagged `v1.1.0`, after `v1.0.0`. ..."

**12.07-C (nit).** The hotfix bullet could add "(or into the current `release/*` branch, if one is open)", which is the Gitflow rule. Optional.

The trade-off sentence ("teams that deploy continuously usually find it heavy") is right, and it is the caveat the model's author added himself in 2020.

## 12.08 Release tagging and versions

**12.08-A (minor, the content gives away the answer).** The content's example is `v1.0.0-2-g1a2b3c4`, "two commits after v1.0.0", and the question's answer is 2, so the learner can answer without running `describe`. Replace the example with:
> `v2.3.0-5-g1a2b3c4` means "five commits after v2.3.0, at 1a2b3c4".

**12.08-B (nit).** "which records who made the release and when, and can be signed later." An existing tag is not signed later; you create a signed tag. Replace with "and can also be signed (section 15)." Also, step 4's "or `git describe` directly" shows a required skill's command (recall rule). "or ask git to describe the commit directly" is enough.

Goals: annotated tags are required (lightweight tags fail, `08-w1`). Pushing only the tag leaves origin's `main` behind and fails (`08-w2`). `--follow-tags`, `--tags`, and `push origin main v1.1.0` all pass.

## 12.09 Hotfix flow

**12.09-A (major, teaches a subtly wrong practice).** Step 2 puts the fix *and* `VERSION 1.0.1` in one commit. Step 4 then cherry-picks that commit onto `main`, so `main` (heading for 1.1.0, with unreleased work) now says `VERSION 1.0.1`. The step-4 sentence "Carry the fix into `main` without bringing the version bump logic into question" is garbled. The usual practice, and the reason to cherry-pick at all, is to keep the fix in its own commit and carry only that commit. It also matters for 12.13: a learner who bumps VERSION there and copies this pattern gets a VERSION conflict. Fix (route tested as `09-a2`, passes the current goals):
- Steps 2 to 4:
  > 2. In `src/store.js`, change `notes.slice(0, LIMIT)` to `notes.slice(-LIMIT)` and commit. Keep this commit to the fix alone.
  > 3. Set `VERSION` to `1.0.1`, commit, and tag that commit `v1.0.1` with an annotated tag.
  > 4. Carry the fix into `main`: switch to `main` and cherry-pick the fix commit, not the version bump. `main` is heading for its own next version.
- Paragraph 2: replace "Cherry-pick the fix commit onto `main` when the hotfix is one or two commits." with "Cherry-pick the fix commit onto `main` when you want only the fix." After the merge sentence, add "A merge brings the version bump along too, so `VERSION` on `main` then needs correcting."
- "What just happened": "`v1.0.1` sits two commits after `v1.0.0`, off to the side of `main`: the fix and the version bump. `main` has the same fix as a new commit on top of its own work. Compare `git show v1.0.1~1` and `git show main` to see the same diff twice with different parents."
- Hints 2 and 3: "Commit the fix alone, then the version bump, and tag the bump `v1.0.1` (annotated)." / "On main, cherry-pick the fix commit: `git cherry-pick hotfix/1.0.1~1`, or use its hash from the log. Merging the hotfix branch also passes."
- `solution.yaml`: split the commit (`git commit -am "Keep the most recent notes when trimming"`, `echo "1.0.1" > VERSION`, `git commit -am "Bump version to 1.0.1"`) and use `git cherry-pick hotfix/1.0.1~1`.

**12.09-B (minor, valid route fails).** "hotfix/1.0.1 starts at v1.0.0" requires the branch to still exist at the end. Deleting the hotfix branch after tagging and carrying it forward is standard, and it fails (`09-a1`). Fix (tested): add `"sticky": true` to that goal. Branching from `main` still fails (`09-w1`).

## 12.10 Force-push etiquette

**12.10-A (major, action unsafe on a second press).** `actions/sam-force-push.sh` decides whether it already ran by looking for Sam's commit in `origin/main`. Once the learner restores origin, the commit is no longer there:
- A second press re-breaks `main`. Live `10-a2` (press, restore, press) FAILS.
- After the learner protects origin, a press exits non-zero with `! [remote rejected] ... (non-fast-forward)` and a `set -e` abort.

Fix (tested: `10-a1`, `10-a2` and `10-a3` pass; four presses all exit 0): decide from Sam's *local* `main`, and turn a press after protection into a demonstration:
```bash
#!/usr/bin/env bash
# Sam rewrites main by mistake: drops the two newest commits, adds his own,
# and force-pushes. It happens once: later presses do not repeat it. Once
# origin refuses non-fast-forward pushes, a later press shows Sam's retry
# being refused.
source "$CANOPY_LIB/setup-lib.sh"
goto teammate
as sam
git switch -q main
if git log --format=%s main | grep -qx "Rewrite changelog as a table"; then
  if [[ $(git -C "$LESSON_ROOT/origin.git" config --bool receive.denyNonFastForwards || true) == true ]]; then
    echo "Sam runs: git push --force origin main"
    git push -q --force origin main 2>&1 || echo "origin refused it: main can no longer be rewritten."
  else
    echo "Sam's force-push already happened. He is leaving main alone now."
  fi
  exit 0
fi
git fetch -q origin
git reset -q --hard "$(git rev-parse origin/main~2)"
tick 1800
write CHANGELOG.md "# Changelog" "" "| Version | Notes |" "|---|---|" "| unreleased | add and list notes |"
commit "Rewrite changelog as a table"
git push -q --force origin main
echo "Sam ran: git push --force origin main"
echo "origin/main is now at '$(git log -1 --format=%s origin/main)'."
```

**12.10-B (minor, dead end without guidance).** If the learner protects origin before restoring it (step 4 before step 3), their own `--force-with-lease` repair is refused (`10-w2`). Nothing tells them how to get out. Fix:
- Step 4: "Now that `main` is repaired, protect origin (once this is on, even a repair like yours is refused): `git -C ../origin.git config receive.denyNonFastForwards true`. From now on the bare repo refuses rewrites of any branch. Press the button again if you want to see Sam's retry refused."
- Hint 3, append: "If you set it before restoring, your repair is refused too: run `git -C ../origin.git config --unset receive.denyNonFastForwards`, restore, then set it again."

**12.10-C (minor, goal clarity and a loophole).**
- One successful `git push -f` locks the restore goal for the rest of the attempt (`10-w1`), but the label "origin's main is back at the correct tip" never says why. Label: "origin's main is back at the correct tip, restored with --force-with-lease (a plain --force does not count)".
- A `+main` refspec force is not caught by the `not` check (`10-w3` passes live). Extend its regex (tested; `10-w3` now fails):
```json
"matches": "^git push\\b.*(\\s--force(\\s|$)|\\s-f(\\s|$)|\\s\\+\\S)"
```

Content accuracy is good: `denyNonFastForwards` applies to every ref, and the remote-tracking reflog in each clone is a real recovery path. Restoring from `origin/main@{1}` also passes (`10-a1`).

## 12.11 Avoid conflicts before they happen

**12.11-A (major, trap).** Setup leaves an unstaged README edit on `narrow` (the learner starts there), but step 1 says "Switch to `wide` and merge `main` into it". The README edit goes along with the switch, and git lets the merge proceed because README is not involved. If the learner resolves and commits with `git commit -am` or `git add -A` (both common), the whitespace-laden README edit is committed into `wide`'s merge and is gone from `narrow`. The README goal can then only pass if they retype it by hand (`11-a2` FAILS). The reference solution avoids this with an unexplained `git stash`. Fix: do the README step first, while the learner is on `narrow` (route tested as `11-a3`, passes). Replace "Try it" with:
> 1. You start on `narrow`, and README.md has an unstaged edit waiting. Run `git diff --check`, fix what it reports, and commit the edit.
> 2. Switch to `wide` and merge `main` into it. Resolve the conflict so that the file keeps the four-space indentation, the search command, and Sam's new usage text. Commit the merge.
> 3. Switch to `narrow` and merge `main` into it. Watch what happens.
> 4. Answer the two questions in the lesson panel.

Move hint 2 to hint 1. Reorder `solution.yaml` the same way and drop the `stash` and `stash pop` lines.

**12.11-B (minor, passable by wrong approach).** "Run git diff --check before committing the README edit" passes if it is run at any time, including after committing (`11-w1`). Fix (tested; the reference, `11-a1` and `11-a3` pass, `11-w1` fails):
```json
{ "label": "Run git diff --check before committing the README edit", "sticky": true,
  "check": { "type": "all", "checks": [
    { "type": "usedCommand", "matches": "^git diff\\b.*--check", "exitCode": null, "last": true },
    { "type": "fileContent", "source": "narrow", "path": "README.md", "notContains": "## Search" }
  ] } }
```

**12.11-C (nit, overstatement).** "Whitespace changes are invisible to you and a conflict for everyone else." Replace with "Stray whitespace edits are hard to see in your editor, and each one is a changed line that can conflict with someone else's work."

Rebasing `wide` onto `main` instead of merging passes. The questions are correct.

## 12.12 Work from a fork

**12.12-A (nit).** "so they merge cleanly on the other side" overpromises. Use "so they apply to the project as it is today". You could also add one clause: "Hosting platforms offer a 'sync fork' button that does the same fetch, fast-forward and push."

Goals robust:
- `pull upstream main`, `reset --hard upstream/main`, branching from `upstream/main` before syncing `main`, an absolute remote URL, and `push origin` followed by `branch -u` all pass.
- Branching before the sync fails (`12-w1`), and pushing to `upstream` fails (`12-w2`).

## 12.13 Boss: ship a release

**12.13-A (minor, unexplained refusal, no hints).** After a review fix commit, `git branch -d feature/export` refuses even though `main` has the work. The branch's upstream (the stale backup on origin) does not contain the new commit (`13-w1`: the deletion goal stays open). The author noted this, but the learner gets no help, and this boss is the only one in the section with no hints (7.17 and 11.13 have them). Add to `lesson.yaml`:
```yaml
hints:
  - "Review with a log of the branch's patches or the three-dot diff against main. Remove the DEBUG line with a new commit or by rewriting the branch."
  - "If deleting feature/export locally refuses, git is comparing it with the old copy on origin. Delete the branch on origin first, or force-delete once main has the work."
  - "The patch release starts at the tag: branch from v1.0.0, fix, tag v1.0.1, push the tag, then carry the fix commit to main and push."
```

**12.13-B (nit, realism).** `v1.0.0` is tagged on a commit whose `VERSION` is `0.1.0` (from the fixture), unlike 12.08 and 12.09. A setup step in `teammate` before the tag (`write VERSION "1.0.0"`, `commit "Release 1.0.0"`, `git push -q origin main`) would fix it. Untested. It would also leave `work` one commit behind, which the learner pulls anyway.

Goals robust:
- Rebase+no-ff (reference), squash merge, rebase+ff after deleting the remote branch first, merging the hotfix branch, and tagging `v1.1.0` after the hotfix all pass (`13-a1`, `13-a2`).
- Fixing on `main` and tagging it `v1.0.1` fails (`13-w1`).

---

## Alternative-approach tests

"Live" = current lessons; "Fixed" = scratch copy with the tested fixes above. "(correct)" = a wrong approach that fails, as intended.

| Lesson | File | Approach | Live | Fixed |
|---|---|---|---|---|
| 12.01 | 01-a1 | `checkout -b`, push without -u, `-D`, delete via `:branch` | ok | ok |
| 12.01 | 01-a2 | publish after merging, `push -d` | ok | ok |
| 12.01 | 01-w1 | fast-forward merge (wrong) | FAIL (correct) | FAIL (correct) |
| 12.01 | 01-w2 | never publish the branch (wrong) | FAIL (correct) | FAIL (correct) |
| 12.02 | 02-a1 | base `origin/main`, `push origin import-csv`, answer `export.js` | **FAIL** | ok |
| 12.02 | 02-a2 | URL `../origin.git` | ok | ok |
| 12.02 | 02-a3 | `request-pull -p` | **FAIL** | ok |
| 12.02 | 02-a4 | no `<end>` (git exits 1) | FAIL (correct) | FAIL (correct) |
| 12.02 | 02-w1 | request-pull without pushing (wrong) | FAIL (correct) | FAIL (correct) |
| 12.03 | 03-a1 | `pull --ff-only` main, rebase main, merge origin/main then origin/export-pdf | ok | ok |
| 12.03 | 03-a2 | no fetch, `rebase origin/main tags-ui`, `--force-if-includes` | ok | FAIL (correct: never fetched) |
| 12.03 | 03-a3 | merge origin/main first, then `pull --no-rebase` | ok | ok |
| 12.03 | 03-w1 | rebase the shared branch (wrong) | FAIL (correct) | FAIL (correct) |
| 12.03 | 03-w2 | `push -f` (wrong) | FAIL (correct) | FAIL (correct) |
| 12.03 | 03-w3 | merge into the private branch (wrong) | FAIL (correct) | FAIL (correct) |
| 12.04 | 04-a1 | one new fix commit | ok | ok |
| 12.04 | 04-a2 | `--fixup` + autosquash, three-dot range-diff | ok | ok |
| 12.04 | 04-w1 | range-diff before fixing (wrong) | **ok** | FAIL (correct) |
| 12.04 | 04-w2 | throw the feature away (wrong) | FAIL (correct) | FAIL (correct) |
| 12.05 | 05-a1 | `reset --soft main`, three fresh commits | ok | ok |
| 12.05 | 05-a2 | one rebase: edit stuff + fixup fix, split, reword | ok | ok |
| 12.05 | 05-w1 | fixup + reword only, no split (wrong) | FAIL (correct) | FAIL (correct) |
| 12.05 | 05-w2 | tests committed before the module (wrong order) | **ok** | FAIL (correct) |
| 12.05 | 05-w3 | lowercase / too-long subjects (wrong) | FAIL (correct) | FAIL (correct) |
| 12.06 | 06-a1 | rebase + `merge --ff-only`, `push t3:main`, each action pressed twice | ok | ok |
| 12.06 | 06-a2 | both actions pressed first (reverse order), squash, `pull --rebase` | ok | ok |
| 12.06 | 06-a3 | action between commit and push, recover with `pull --rebase` | ok | ok |
| 12.06 | 06-w1 | `--no-ff` merge, two tasks in one commit (wrong) | FAIL (correct) | FAIL (correct) |
| 12.06 | 06-w2 | batch all three, push once (against the spirit) | ok | ok (accepted, 12.06-D) |
| 12.06 | 06-w3 | task branches left behind (wrong per label) | **ok** | FAIL (correct) |
| 12.07 | 07-a1 | `checkout -b`, release→develop first, delete branches at end | **FAIL** (harness) | ok |
| 12.07 | 07-a2 | delete release branch before tagging | **FAIL** | ok |
| 12.07 | 07-w1 | fast-forward feature merge (wrong) | FAIL (correct) | FAIL (correct) |
| 12.07 | 07-w2 | tag the release branch, not main (wrong) | FAIL (correct) | FAIL (correct) |
| 12.08 | 08-a1 | `push --tags`, `push origin main v1.1.0`, build.sh twice | ok | ok |
| 12.08 | 08-a2 | `--follow-tags`, `push` + `push --tags` | ok | ok |
| 12.08 | 08-w1 | lightweight tags (wrong) | FAIL (correct) | FAIL (correct) |
| 12.08 | 08-w2 | push only the tag (wrong) | FAIL (correct) | FAIL (correct) |
| 12.09 | 09-a1 | merge hotfix into main, delete hotfix branch | **FAIL** | ok |
| 12.09 | 09-a2 | fix and bump split, cherry-pick only the fix (proposed flow) | ok | ok |
| 12.09 | 09-w1 | hotfix branched from main (wrong) | FAIL (correct) | FAIL (correct) |
| 12.10 | 10-a1 | action twice, restore from `origin/main@{1}`, `config -f` | ok | ok |
| 12.10 | 10-a2 | lease before fetch (refused), fetch, lease, action again | **FAIL** (re-broken) | ok |
| 12.10 | 10-a3 | `cd ../origin.git` to protect, action after protection | ok (action errors) | ok (refusal shown) |
| 12.10 | 10-w1 | `push -f` (wrong) | FAIL (correct) | FAIL (correct) |
| 12.10 | 10-w2 | protect before restoring (stuck) | FAIL | FAIL (now explained, 12.10-B) |
| 12.10 | 10-w3 | `push origin +main` then a no-op lease push (wrong) | **ok** | FAIL (correct) |
| 12.11 | 11-a1 | content order without stash, commit only cli.js | ok | ok |
| 12.11 | 11-a2 | content order, `commit -am` during the wide merge | **FAIL** (trap) | FAIL under old order; fixed by the 12.11-A reorder |
| 12.11 | 11-a3 | README first, then rebase wide onto main (proposed order) | ok | ok |
| 12.11 | 11-w1 | `diff --check` only after committing (wrong) | **ok** | FAIL (correct) |
| 12.12 | 12-a1 | absolute URL, `pull upstream main`, `push --set-upstream origin HEAD` | ok | ok |
| 12.12 | 12-a2 | `reset --hard upstream/main`, push then `branch -u` | ok | ok |
| 12.12 | 12-a3 | branch from `upstream/main`, sync main afterwards | ok | ok |
| 12.12 | 12-w1 | branch before syncing (wrong) | FAIL (correct) | FAIL (correct) |
| 12.12 | 12-w2 | push the contribution to upstream (wrong) | FAIL (correct) | FAIL (correct) |
| 12.13 | 13-a1 | amend via rebase, lease push, merge main in, squash, merge hotfix, push hotfix branch | ok | ok |
| 12.13 | 13-a2 | new fix commit, rebase, delete remote first then `-d`, ff merge, cherry-pick tag | ok | ok |
| 12.13 | 13-w1 | hotfix made on main (wrong; also shows the `-d` refusal) | FAIL (correct) | FAIL (correct) |

Commands: `./target/debug/canopy-lesson test 12.xx --solution /tmp/claude-1000/review12/<file>.yaml` (live) and the same with `--lessons /tmp/claude-1000/review12/lessons` (fixed).

## Applied (second pass, 2026-10-03)

All 4 majors and all 15 minors were applied to the live files as proposed above. So were these nits: X1 (notes), 12.02-B/C, 12.03-B, 12.05-C, 12.07-B/C, 12.08-B, 12.11-C and 12.12-A. The 12.13 boss also got the proposed hints. `solution.yaml` for 12.09 (split fix/bump, `cherry-pick hotfix/1.0.1~1`) and 12.11 (README step first, no stash) were rewritten to match the new content. The author notes now describe the current engine (marks re-read on every check, goals re-checked after actions, per-attempt global/system/XDG config) and list the review changes.

Not applied:
- 12.04-B: the guard goal still passes at the start, which is harmless.
- 12.06-D: batching is accepted. Leftover task branches now fail it anyway.
- 12.13-B: the VERSION realism setup change is untested and touches the boss setup.

Live results:
- `validate`: no 12.x errors or warnings.
- `test 12`: 13/13 ok. Only clean-tree and guard goals pass at the start.
- Every alternative and wrong-approach yaml in the table gives its "Fixed" result. The one change is `06-w2`, which now fails because it leaves its task branches behind.
- New route `11-a4` passes: README first, with `add -A` and `commit -am` during the merge.
- Actions pressed four times in a row exit 0 each time (12.06 both, 12.10). A 12.10 press after protection shows the refusal and exits 0.
