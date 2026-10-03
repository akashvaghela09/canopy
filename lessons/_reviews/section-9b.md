# Review: section 9, part 2 (lessons 9.14 to 9.27)

Reviewer: independent senior review, 2026-10-03. Lessons 9.01 to 9.13 are reviewed separately. No lesson files were edited. Every goal fix marked "tested" was applied to a scratch copy (`/tmp/claude-1000/review9b/fixed`) and run through `canopy-lesson test`, with the reference solution and with every alternative solution listed at the end. The alternative solutions are in `/tmp/claude-1000/review9b/alt/`. Local git is 2.43.0.

## Overall verdict

This part of the section is strong. The interactive rebase lessons build the todo list up one command at a time, the setups are small and deterministic, and every reference solution passes (`validate`: 225 lessons, 0 errors, no section 9 warnings; `test` 9.14 to 9.27: 14 ok). The editor step is described the app's way throughout ("the editor opens", "save"), and no editor is named. The git behaviour I checked by hand is correct: oldest first, `pick` fast-forwarding, `break`, `reword`/`squash`/`fixup` message handling, the double conflict when commits are swapped, `edit` leaving HEAD detached, `add -p` hunk spacing, `--autosquash`, `update-ref` lines, `--rebase-merges`, and the stale-info refusal from the lease. The goals accept nearly every reasonable alternative I tried. That includes `--root`, short command letters, deleting a line instead of `drop`, `break` instead of `edit`, either split order, three `--onto` rebases or chained plain rebases for the stack, `pull.rebase` set before pulling, `pull --rebase` or `reset --hard origin/login` for integrating Sam's commit, and three different boss routes.

Three findings matter most:
- **9.25 says a plain `git pull` merges when the histories have diverged. In the app it refuses.** The app sets no `pull.rebase`, and git 2.33+ stops with "Need to specify how to reconcile divergent branches". Lesson 7.06 teaches exactly that. (major)
- **9.26 misdescribes `--force-if-includes`.** It says the option checks that the fetched tip "is part of your branch's history". The real check uses the branch's reflog, not ancestry. Read the lesson's way, step 5 (a rebase, then a push that succeeds) contradicts the explanation. (major)
- **9.22 rejects `exec` lines typed by hand.** The lesson opens by teaching `exec` lines, but the goal only accepts `-x`/`--exec` on the command line. (major)

Counts: **0 blocker, 3 major, 7 minor, 11 nit.**

---

## 9.14 Interactive rebase basics

**9.14-A (minor). The "run it unchanged" step is not checked.**
File `9.14/goal.json`, goal "Run an interactive rebase of the last three commits" (`usedCommand` `\bgit rebase\b.*(\s-i\b|--interactive)`). The `break` run also matches this, so a learner can skip step 2 completely. Curriculum check: "history unchanged after the no-op run".
Tested: `9.14-b` (only break + abort) passes. `9.14-w2` (`edit` instead of `break`, with no no-op run) passes.
Fix (tested). The goal latches only when an interactive rebase command finished with nothing in progress and `main` still on its original tip:
```json
{ "label": "Run an interactive rebase of the last three commits and save the list unchanged", "sticky": true, "check": { "type": "all", "checks": [
    { "type": "usedCommand", "matches": "\\bgit rebase\\b.*(\\s-i\\b|--interactive)", "last": true },
    { "type": "operation", "value": null },
    { "type": "refAt", "ref": "main", "target": "@mark:c4" } ] } },
```
With this fix, the reference solution and `9.14-a` (`--root` for the no-op run, `b` for break) pass. `9.14-b` and `9.14-w2` fail.

**9.14-B (minor). Wrong reason given for the ids staying the same.** The same wording appears in 9.22.
`9.14/content.md`: "git noticed each replayed commit was identical to the original and kept the originals". `9.22/content.md`: "each replayed commit was identical to its original".
Why: git does not replay the commit and then compare the result. When a `pick` would build on the same parent the commit already has, the sequencer skips the replay and keeps the original (it fast-forwards). That is also why 9.22 stops on the real commit. Learners who take "identical" literally will expect the same result after any rebase that produces an identical tree, which is false: a rebase onto a new base always makes new ids.
Fix 9.14: "With nothing changed in the list, each commit's parent was still the same, so git kept the original commit instead of making a copy. No ghosts appeared." Fix 9.22: "Because nothing in the list changed, git kept each original commit instead of copying it (its parent was the same), so the rebase stopped on the real commit, not a copy."

**9.14-C (nit).** `content.md`: "Edit the list, save, close". In the app, one action does both: the in-app editor has a single "Save and continue" button. Write "Edit the list and save it".

**9.14-D (nit).** The goal label says "Pause a rebase with break", but the check is any rebase in progress, so `edit` passes too. Change the label to "Pause the rebase (with break)" or leave it. Checking for `break` itself would need a shell check, which is not worth it.

**9.14 note (nit, author notes).** `_notes/section-9.md` says "The learner never sees `git rebase --abort` before 9.11 otherwise". 9.11 comes before 9.14 and already teaches `--abort`, so the sentence is confused but harmless. Delete it.

## 9.15 Reword

No findings. The content is accurate: the message editor opens when the replay reaches the commit, and the rebase finishes on its own. Tested: `edit` + `commit --amend -m` (9.15-a) and `r` on line 2 with `--root` (9.15-b) pass. Rewording the wrong line (9.15-w1) fails. On 2.43, `--root` keeps the root's id when its line is unchanged, so `refAt main~3 @mark:base` holds.

## 9.16 Squash and fixup

**9.16-A (nit). No guidance for a second message editor.** Step 3 covers only the login group's editor. A learner who also uses `squash` for "oops forgot file" gets a second editor with "Add password reset" and "oops forgot file". Keeping both fails the goal, and nothing explains why. Append to step 3: "If the editor opens again for the reset group, leave only `Add password reset`." Tested: squash for both groups, with an editor that keeps only the two subjects (9.16-b), passes.

**9.16-B (nit, accept).** `git reset --soft HEAD~5` followed by two hand-made commits (9.16-w2) passes without any rebase. The curriculum check (count and messages) allows this, and the end state is right. If the lead wants rebase use enforced, add `{ "type": "usedCommand", "matches": "\\bgit rebase\\b.*(\\s-i\\b|--interactive)" }` to the first goal. I would leave it.

Tested: all-`fixup` (9.16-a), squash in both groups (9.16-b) and two separate rebases (9.16-c) pass. `squash` keeping the default combined message (9.16-w1) fails, as it should.

## 9.17 Reorder and drop

No findings. I confirmed the double conflict: mix conflicts against the skeleton, then fry conflicts against mix. The two target files given in steps 3 and 4 are right. Tested: deleting the TODO line instead of `drop` (9.17-a) passes, and so does dropping in one rebase and reordering in a second (9.17-b). Resolving the first stop with both lines (9.17-w1) fails on the commit-content goal, which is correct. The destructive flag and its opening sentence are present.

## 9.18 Edit a commit mid-history

No findings. Tested: `--root` with `e` and `commit -a --amend --no-edit` (9.18-a) passes. So does a `break` line after the README pick plus a plain `commit --amend` that opens the editor (9.18-b). Adding the Usage section as a new commit (9.18-w1) fails.

## 9.19 Stage part of a file

**9.19-A (nit). `s` is listed among the answers "you will use most", but this file never offers it.** In the transcript, git's prompt is `[y,n,q,a,d,e,?]`, because each of the four hunks is already minimal. Change the line to "`s` split the hunk into smaller ones (offered only when the hunk contains separate changes)".

Tested: `git add -p` with no path, ending with `q` (9.19-a), passes. `--patch` and `--message=` (9.19-b) pass. Staging a DEBUG hunk (9.19-w1) fails. The `staged: [] exact` status check is a good touch.

## 9.20 Split a commit

**9.20-A (nit, recall).** `content.md` line 5 shows `git rebase --continue`, which is a command from `rebase-i-edit`, a required skill. Write "Then continue the rebase."

**9.20-B (nit). "Together they equal the original" passes at the start**, because `main~1` is the big commit, which has both changes. Fix (tested): add `{ "type": "refNotAt", "ref": "main", "target": "@mark:c3" }` to that goal.

Tested: footer first with `reset HEAD~` (9.20-a) and `reset --mixed HEAD^` + `add --patch` + `commit -am` (9.20-b) pass. Putting both changes into "Add search box" (9.20-w1) fails.

## 9.21 Fixup commits and autosquash

**9.21-A (minor). "Fold them in" passes at the start.** The starting history already has three commits on the skeleton with the original messages, so the checklist shows a tick before the learner has done anything.
Fix (tested): add `{ "type": "refNotAt", "ref": "main", "target": "@mark:ctrl" }` to that goal's `all`.

**9.21-B (nit).** On git 2.43, `git rebase --autosquash HEAD~6` without `-i` prints "Successfully rebased" and folds nothing (9.21-c). Since git 2.44 it works without `-i`. A learner who leaves out `-i` gets success output and an unchanged history. Optional addition after the command block: "(Before git 2.44, `--autosquash` needs `-i`; without it nothing is folded.)"

Tested: fixups made in reverse order with `:/` refs plus `rebase.autoSquash=true` (9.21-a) pass. So do fixups followed by a plain `rebase -i` with the lines moved by hand (9.21-b). `--squash` instead of `--fixup` (9.21-w1) fails, as it should.

## 9.22 Run a command at every step

**9.22-A (major). `exec` lines typed by hand are rejected.**
File `9.22/goal.json`, goal 1: `"matches": "\\bgit rebase\\b.*(\\s-x\\s|--exec)", "exitCode": 1`. The lesson opens with "A todo line can run a shell command: `exec ./test.sh`", and 9.14 says "everything else in interactive rebase is a different word in that list". Step 2 ("with the test as the command after every step") is fully met by typing `exec ./test.sh` under each pick in the editor.
Tested: 9.22-b (`rebase -i HEAD~5`, exec lines added in the editor) stops at `@mark:broken` but fails goal 1.
Fix (tested):
```json
"matches": "\\bgit rebase\\b.*(\\s-x|--exec|\\s-i\\b|--interactive)", "exitCode": 1
```
`exitCode: 1` still means "something failed", and the sticky goal (HEAD at `@mark:broken` during the rebase) still pins the outcome. In this lesson only a failing exec can make a rebase exit 1.

**9.22-B (minor).** See 9.14-B ("identical" wording).

**9.22-C (minor). "Abort the rebase; main is unchanged" passes at the start.**
Fix (tested): put `{ "type": "usedCommand", "matches": "\\bgit rebase\\b.*--abort" }` first in that goal's `checks`. 9.14 already does this.

**9.22-D (nit). Hint 1 gives the full command.** Hints should get more specific step by step. Make hint 1 "Read `test.sh` first. The option that adds a command after every pick is `-x` (`--exec`)." and keep the command for hint 2.

Tested: `rebase -x` without `-i` (9.22-a) and `-i --exec "bash test.sh"` (9.22-c) pass. A manual search with `switch --detach` (9.22-w1) fails, as it should. Both question answers are correct.

## 9.23 Rebase a stack of branches

**9.23-A (minor). The todo-list view of `--update-refs` is not shown.** The section teaches interactive rebase as "the todo list is the whole interface". Here `git rebase -i --update-refs main` shows:
```
pick 0812c69 Add database layer
update-ref refs/heads/part1
pick b986fa3 Add API layer
update-ref refs/heads/part2
pick 9927fa6 Add UI layer
```
Add after the first code block: "With `-i`, you can see it in the todo list: an `update-ref refs/heads/part1` line after the commit that `part1` points to." Also, "leaves `part1` and `part2` pointing at the old copies" should say "at the old commits", because the originals are not copies.

Tested: `rebase.updateRefs=true` + plain rebase (9.23-a) passes. So do three `--onto` rebases using `@{1}` (9.23-b), chained plain rebases part1, part2, part3, which rely on git's skip of already-applied commits (9.23-c), and `-i --update-refs` (9.23-d). A plain `rebase main` (9.23-w1) fails. `minGit: "2.38"` is correct.

## 9.24 Keep merges when rebasing

No findings. The content is accurate: a plain rebase drops merges, and `label`/`reset`/`merge` describe the shape in `-i` mode. `editor-undo` stays where it was unless `--update-refs` is given. Tested: `-r` (9.24-a) and `-i --rebase-merges` (9.24-b) pass. A plain rebase (9.24-w1) and `merge main` (9.24-w2) fail.

## 9.25 Pull with rebase

**9.25-A (major). The opening describes a plain pull wrongly for this app.**
`9.25/content.md`: "When your push is rejected because origin moved on, a plain pull merges the remote commits into your branch and leaves a merge commit behind".
Tested (9.25-d): a plain `git pull` in this lesson prints "hint: You have divergent branches and need to specify how to reconcile them" and stops. The app's global config sets no `pull.*`, and this has been git's behaviour since 2.33. 7.06 teaches exactly this, so the sentence contradicts what the learner already saw. It also hides the nice payoff: `pull.rebase true` is one of the answers to the hint they met in 7.06.
Fix: "When your push is rejected because origin moved on, you have so far pulled with a merge (`--no-rebase`, or `pull.rebase false`). That leaves a merge commit behind that says nothing more than \"I synced\". `pull --rebase` fetches, then rebases your local commits on top of what arrived:". In "What just happened", add: "`pull.rebase true` is the rebase answer to the hint a plain `git pull` printed in 7.06."

**9.25-B (nit, recall).** `content.md` shows `git rebase --continue` (from `rebase-conflict`, a required skill). Write "resolve, stage and continue the rebase". Hint 1 also gives `git pull --rebase` straight away. Move the command to hint 2 and make hint 1 "Read the rejection, then pull so that your two commits are replayed on top of Sam's."

Tested: fetch + `rebase origin/main` + `config --local` (9.25-a) passes. So do `pull.rebase true` set first followed by a plain `pull` (9.25-b) and `pull -r` + `push origin main` (9.25-c). `pull --no-rebase` (9.25-w1) fails.

## 9.26 Update a published branch safely

**9.26-A (major). `--force-if-includes` is explained wrongly.**
`9.26/content.md`: "`--force-if-includes` closes it by also checking that the fetched tip is part of your branch's history".
Why: git does not test ancestry. It checks that the remote-tracking tip appears in the **reflog** of your local branch, which means your branch contained it at some point. The lesson's own step 5 shows the difference. After the fast-forward and the rebase onto `origin/main`, Sam's fetched commit is no longer an ancestor of `login` (it was copied). Yet `--force-with-lease --force-if-includes` succeeds. A learner who reads "part of your branch's history" as ancestry would expect a refusal there. Tested both ways: the reference solution's final push succeeds. Without the fast-forward (9.26-w2), the push is refused with "remote ref updated since checkout".
Fix: "`--force-if-includes` closes it: git also checks that your branch has, at some point, contained what you fetched (it looks in the branch's reflog). Commits that a fetch brought in but you never merged or rebased into your branch cannot be overwritten."
Optional, for step 5: "`--force-if-includes` passes because your `login` contained Sam's commit before the rebase."

**9.26-B (minor). The "lease refuses" goal accepts any failing lease push.**
Goal 2 is `usedCommand ... --force-with-lease` with `exitCode: 1`. A typo such as `git push --force-with-lease origin nosuchbranch` also exits 1 and latches it, even before Sam has pushed.
Tested: 9.26-w4b (typo push, Sam pressed later, no real refusal ever seen) passes every goal.
Fix (tested). Latch only when origin had Sam's commit and the learner's branch did not:
```json
{ "label": "See the lease refuse a push after Sam's commit arrived", "sticky": true, "check": { "type": "all", "checks": [
    { "type": "usedCommand", "matches": "\\bgit push\\b.*--force-with-lease", "exitCode": 1, "last": true },
    { "type": "fileInRev", "repo": "origin.git", "rev": "login", "path": "logout.html", "present": true },
    { "type": "fileInRev", "rev": "login", "path": "logout.html", "present": false } ] } },
```
The reference solution, 9.26-a and 9.26-b pass. 9.26-w4b fails.

**9.26-C (minor). The "never a plain --force" regex misses bundled flags and `+` refspecs.** This also applies to 9.27.
`\bgit push\b.*\s(-f|--force)(\s|$)` lets through `git push -fu origin login` (9.26-w5) and `git push origin +login` (9.26-w3). Both pass the lesson today, and both are exactly the unprotected force push the lesson warns against.
Fix (tested in 9.26 goal 4 and 9.27 goal 6):
```json
"matches": "\\bgit push\\b.*(\\s(-[a-zA-Z]*f[a-zA-Z]*|--force)(\\s|$)|\\s\\+[^\\s+])"
```
`--force-with-lease`, `--force-if-includes`, `-u` and `--follow-tags` do not match it. 9.26-w3 and 9.26-w5 now fail, and every valid solution still passes. While editing 9.26, consider moving this `not` check into goal 3's `all`, as 9.27 does, so the checklist does not show a tick at the start.

Tested: reword via `rebase -i` + `--force-with-lease=login origin login` + `pull --rebase` (9.26-a) passes. So does `--force-if-includes` on every push + `reset --hard origin/login` (9.26-b). Fetching and rebasing without integrating Sam's commit (9.26-w1) fails: Sam's commit is lost on origin and goal 3 catches it. The same with `--force-if-includes` (9.26-w2) is refused, which is correct. The action is idempotent: pressed twice, it prints "Sam's commit is already on origin/login." `minGit: "2.30"` is correct.

## 9.27 Boss: prepare a branch for review

**9.27-A (minor).** The same `--force` regex gap as 9.26-C (goal 6, the inner `not`). Apply the same regex.

Otherwise no findings. The goals check shape, messages, file sets, the conflict resolution and the lease, not the route. Tested:
- 9.27-a: plain rebase onto `origin/main` first (resolving the README conflict), then a second `rebase -i` for reorder, fixup, reword and edit, a split by file, and `--force-with-lease --force-if-includes`. Passes.
- 9.27-b: no interactive rebase at all (`reset --soft origin/main`, then five hand-made commits). Passes. That is acceptable for a boss.
- 9.27-c: split on the old base first, then one `rebase -i origin/main` that conflicts at the README commit, then `--force-with-lease=feature/export`. Passes.
- Forgetting to fetch (9.27-w1), a `-f` push (9.27-w2) and keeping Sam's "CVS" line (9.27-w3) all fail.

Observation, no change: after `reset HEAD^` at the oversized commit, `settings.js` is untracked, so `git add -p` only offers the README hunk. A learner who reaches for patch mode has to add `settings.js` as a whole file. That is fine for a boss.

---

## Alternative-approach tests

All runs use `./target/debug/canopy-lesson test <id> --solution /tmp/claude-1000/review9b/alt/<file>`. "Fixed" means against the scratch copy with the tested goal fixes above.

| File | Approach | Original | Fixed | Expected |
|---|---|---|---|---|
| 9.14-a | no-op run with `--root`, `b` for break, abort | ok | ok | pass |
| 9.14-b | only break + abort, no no-op run | ok | FAIL | fail (9.14-A) |
| 9.14-w1 | `--continue` instead of `--abort` | FAIL | FAIL | fail |
| 9.14-w2 | `edit` to pause, no no-op run | ok | FAIL | fail |
| 9.15-a | `edit` + `commit --amend -m` | ok | ok | pass |
| 9.15-b | `r` with `--root` | ok | ok | pass |
| 9.15-w1 | reword the wrong line | FAIL | FAIL | fail |
| 9.16-a | `f` for all three | ok | ok | pass |
| 9.16-b | `s` in both groups, both messages trimmed | ok | ok | pass |
| 9.16-c | two separate rebases | ok | ok | pass |
| 9.16-w1 | squash, keep combined message | FAIL | FAIL | fail |
| 9.16-w2 | `reset --soft` + two commits, no rebase | ok | ok | accepted (9.16-B) |
| 9.17-a | delete TODO line, `add -A` | ok | ok | pass |
| 9.17-b | drop in one rebase, reorder in another | ok | ok | pass |
| 9.17-w1 | first stop resolved with both lines | FAIL | FAIL | fail |
| 9.18-a | `--root`, `e`, `commit -a --amend --no-edit` | ok | ok | pass |
| 9.18-b | `break` after the pick, `commit --amend` with editor | ok | ok | pass |
| 9.18-w1 | Usage as a separate commit | FAIL | FAIL | fail |
| 9.19-a | `add -p` without path, `y n y q` | ok | ok | pass |
| 9.19-b | `--patch`, `--message=` | ok | ok | pass |
| 9.19-w1 | stage a DEBUG hunk | FAIL | FAIL | fail |
| 9.20-a | footer first, `reset HEAD~` | ok | ok | pass |
| 9.20-b | `reset --mixed HEAD^`, `add --patch`, `commit -am` | ok | ok | pass |
| 9.20-w1 | both changes in one commit | FAIL | FAIL | fail |
| 9.21-a | reverse order, `:/` refs, `rebase.autoSquash` config | ok | ok | pass |
| 9.21-b | fixups, then lines moved by hand without `--autosquash` | ok | ok | pass |
| 9.21-c | `rebase --autosquash` without `-i` (git 2.43) | FAIL | FAIL | fail on <2.44 (9.21-B) |
| 9.21-w1 | `--squash` instead of `--fixup` | FAIL | FAIL | fail |
| 9.22-a | `rebase -x` without `-i` | ok | ok | pass |
| 9.22-b | `exec` lines typed in the todo list | FAIL | ok | pass (9.22-A) |
| 9.22-c | `-i --exec "bash test.sh"` | ok | ok | pass |
| 9.22-w1 | manual checkout search | FAIL | FAIL | fail |
| 9.23-a | `rebase.updateRefs` config + plain rebase | ok | ok | pass |
| 9.23-b | three `--onto` rebases with `@{1}` | ok | ok | pass |
| 9.23-c | chained plain rebases part1, part2, part3 | ok | ok | pass |
| 9.23-d | `-i --update-refs` | ok | ok | pass |
| 9.23-w1 | plain `rebase main` on part3 | FAIL | FAIL | fail |
| 9.24-a | `rebase -r` | ok | ok | pass |
| 9.24-b | `-i --rebase-merges` | ok | ok | pass |
| 9.24-w1 | plain rebase | FAIL | FAIL | fail |
| 9.24-w2 | `merge main` | FAIL | FAIL | fail |
| 9.25-a | fetch + `rebase origin/main`, `config --local` | ok | ok | pass |
| 9.25-b | `pull.rebase true` first, plain pull | ok | ok | pass |
| 9.25-c | `pull -r`, `push origin main` | ok | ok | pass |
| 9.25-d | plain `git pull` (shows the refusal) | FAIL | FAIL | n/a (9.25-A) |
| 9.25-w1 | `pull --no-rebase` | FAIL | FAIL | fail |
| 9.26-a | reword via rebase, `--force-with-lease=login`, `pull --rebase` | ok | ok | pass |
| 9.26-b | `--force-if-includes` everywhere, `reset --hard origin/login` | ok | ok | pass |
| 9.26-w1 | fetch, rebase, lease push without integrating Sam | FAIL | FAIL | fail |
| 9.26-w2 | same with `--force-if-includes` (refused) | FAIL | FAIL | fail |
| 9.26-w3 | final push `git push origin +login` | ok | FAIL | fail (9.26-C) |
| 9.26-w4b | lease "refusal" from a typo, Sam never refused | ok | FAIL | fail (9.26-B) |
| 9.26-w5 | final push `git push -fu origin login` | ok | FAIL | fail (9.26-C) |
| 9.27-a | rebase first, then tidy with `rebase -i` | ok | ok | pass |
| 9.27-b | `reset --soft origin/main`, five hand commits | ok | ok | pass |
| 9.27-c | split first, then one `rebase -i origin/main` | ok | ok | pass |
| 9.27-w1 | no fetch (stale base) | FAIL | FAIL | fail |
| 9.27-w2 | `push -f` | FAIL | FAIL | fail |
| 9.27-w3 | Sam's README line kept (typo stays) | FAIL | FAIL | fail |

With all tested fixes applied in the scratch copy: `validate` shows 0 errors, and the reference solutions of 9.14, 9.20, 9.21, 9.22, 9.26 and 9.27 still pass.
