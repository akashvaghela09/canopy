# Review: section 7, Remotes (lessons 7.01 to 7.17)

Reviewer: independent senior review, 2026-10-03, against git 2.43.0 (app minimum `MIN_GIT` = 2.32.0). No lesson files were edited. Every proposed fix marked "tested" was applied to a scratch copy (`/tmp/claude-1000/review7/lessons`). The scratch copy validates with no section-7 errors, passes `canopy-lesson test 7` (17/17), and gives the results in the table at the end. Alternative solutions are in `/tmp/claude-1000/review7/*.yaml`.

## Overall verdict

This is a strong section. The scenario (one "trails" fixture, Sam/Priya clones, actions that run real git) is realistic and deterministic. The text is short and mostly exact about fetch, pull, push and remote-tracking branches. `validate` reports no section-7 errors (184 lessons, 19 errors, 5 warnings, all from other sections). `test 7`: 17 tested, 0 failed. Of 38 alternative and wrong-approach runs on the live lessons, every valid route passes except the ones listed below, and every wrong route fails except one (7.12).

Main problems:
- **Pressing "Teammate pushes a fix" too early leaves 7.05, 7.06 and 7.12 impossible to finish.** If the learner presses it before the first fetch/pull (a button in the lesson panel invites this), Sam's fix arrives with the river trail. The sticky "fast-forward to `@mark:river`" goal can then never pass. A second press does nothing, so there is no second divergence to merge. Only Reset gets the learner out, and nothing tells them so. (major, tested fix)
- **7.08 quotes a rejection message git never prints**: `(non-fast-forward)` together with the "remote contains work that you do not have locally" hint. (major)
- **7.06 is wrong on git 2.32 and 2.33.0**, which the app supports. There a plain `git pull` on diverged branches warns and then *merges*. The lesson's step 3 ("Nothing was merged") and its whole explanation describe 2.33.1+. (major)
- **7.02 asks how many branches `git branch -r` lists, expecting 1.** The learner sees two lines (`origin/HEAD -> origin/main`, `origin/main`). (major)

Counts: **0 blocker, 4 major, 11 minor, 10 nit.**

No section-7 lesson uses a `commit` question, so the new `allowRefs` rule changes nothing here.

---

## Cross-cutting

**X1 (major). Early action press dead-ends 7.05, 7.06 and 7.12.**
Files: `7.05|7.06|7.12/actions/teammate-push.sh` and the first goal of each `goal.json` (`refAt main @mark:river`, sticky).
Tested on the live lessons with `05-early.yaml`, `06-early.yaml`, `12-early.yaml` (press, integrate, own commit, press again, integrate). All three FAIL: the fast-forward goal and the merge goal stay open for good.
Why: the brief requires actions to "behave sensibly" when run at unexpected moments. Here an early press silently makes the lesson impossible to finish.
Fix (tested, all three reference solutions and the early-press runs pass):
1. Make the shared action staged, like 7.16's. Replace the whole body of `7.05/actions/teammate-push.sh`, `7.06/actions/teammate-push.sh` and `7.12/actions/teammate-push.sh` with:
```bash
#!/usr/bin/env bash
# Sam keeps working on the lake trail. Each press pushes the next change:
#   1st press: "Fix lake trail distance"
#   2nd press: "Add parking note to lake trail"
#   later presses: nothing new.
# So pressing early (before your own commit) is harmless: press again later.
source "$CANOPY_LIB/setup-lib.sh"

goto teammate
as sam

# Catch up with anything already on origin, so the push cannot be rejected.
git pull -q --no-rebase origin main

if ! git show HEAD:trails/lake.md | grep -q "Distance: 6 km"; then
  sed -i 's/^Distance: 5 km$/Distance: 6 km/' trails/lake.md
  commit "Fix lake trail distance"
elif ! git show HEAD:trails/lake.md | grep -q "^Parking:"; then
  append trails/lake.md "Parking: 20 spaces by the boathouse"
  commit "Add parking note to lake trail"
else
  echo "Sam has nothing new to push."
fi

git push -q origin main
echo "Sam pushed to origin/main:"
git log --oneline -3
```
2. Make the fast-forward goal accept a fast-forward to whatever `origin/main` held, and make the merge goal require the *latest* `origin/main` plus your own commit:
```json
{ "label": "Fast-forward main to the fetched origin/main", "sticky": true, "check": { "type": "all", "checks": [
    { "type": "isAncestor", "ancestor": "@mark:river", "descendant": "main" },
    { "type": "refAt", "ref": "main", "target": "origin/main" },
    { "type": "currentBranch", "name": "main" } ] } }
```
For 7.06, add `{ "type": "usedCommand", "matches": "^git pull\\b" }` as the first sub-check and use the label "Pull Sam's work as a fast-forward". For 7.12, add `{ "type": "usedCommand", "matches": "^git pull\\b.*--ff-only" }` and use the label "Fast-forward with pull --ff-only".
In the merge/integrate goal of all three, append these two sub-checks:
```json
{ "type": "commitCount", "range": "origin/main..main", "min": 1 },
{ "type": "isAncestor", "ancestor": "origin/main", "descendant": "main" }
```
The 7.05 label becomes "Merge Sam's newest push into main with a merge commit".
3. In the "Try it" step that presses the button (7.05 step 4, 7.06 step 3, 7.12 step 3), add: "If you pressed it earlier already, press it again: Sam has one more change."
The new sticky goal does not pass at the start (`@mark:river` is not in `main`). It also does not pass for a `--no-ff` first merge, since `main` then differs from `origin/main`.

**X2 (nit). The actions say "Sam pushed to origin/main:" when nothing was pushed.**
Files: `7.04`, `7.05`, `7.06`, `7.12`, `7.17` `actions/teammate-push.sh`. On the second and third press they print the same three log lines. Only 7.16 says "Sam has nothing new to push."
Fix: in each, set `pushed=1` inside the `if` that commits, and after the push print `echo "Sam has nothing new to push."` when `pushed` is unset (the X1 script already covers 7.05/7.06/7.12).

**X3 (minor). Recall rule: commands from `requires` are shown in "Try it".**
- `7.10/content.md` step 5 and `7.11/content.md` step 4: "Check `git branch -vv`" (`upstream` is required). Replace with "Check that `trail-maps` now has an upstream" / "Check which upstream `signage` has."
- `7.14/content.md` step 1 "Run `git remote -v`" and step 5 "Check with `git remote -v`" (`remote-inspect` is required). Replace with "List the remotes with their URLs" / "List the remotes again".
- `7.16/content.md` routine step 3 shows `git status -sb` (`status-short` is required). Replace with "**Inspect**: the short status with branch info for ahead/behind, and the incoming range `main..origin/main`."

**X4 (nit). Author notes overstate action safety.** `lessons/_notes/section-7.md`, first section: "every action is safe to press twice". That is true for repeated presses but not for early ones (X1). Update the note once X1 is applied. Also record the 7.06 version dependency (7.06-A) in the LESSONS.md version table.

---

## 7.01 Clone a repository

**7.01-A (nit).** `content.md`: "The clone copied every commit from `origin.git` and checked out the newest one". A clone checks out the remote's default branch, not "the newest" commit.
Fix: "...and checked out `main`, the remote's default branch, so the files appear in `work`."

Goals: `git clone ./origin.git work` passes, and so does an absolute path. `git clone --bare origin.git work` correctly fails.

## 7.02 Look at the remote

**7.02-A (major). The answer to "How many branches does `git branch -r` list?" is ambiguous.**
Verified: `git branch -r` prints
```
  origin/HEAD -> origin/main
  origin/main
```
A careful learner counts 2 and is told they are wrong. The content never explains `origin/HEAD`.
Fix (tested): in `goal.json` change the prompt to `"Not counting the \`origin/HEAD -> origin/main\` line, how many remote branches does \`git branch -r\` list?"` and keep `answer: 1`. In `content.md`, after the code block add: "`origin/HEAD -> origin/main` is not a branch: it records which branch is the remote's default."

**7.02-B (minor). The `branch -r/-a` regex rejects combined flags.** `^git branch .*(-r|-a|--remotes|--all)\b` fails `git branch -avv` and `git branch -vr`. Tested: `02-alt.yaml` with `git branch -avv` FAILS.
Fix (tested; `-avv` and `-vr` pass; `git branch --track x` / `-d x` do not):
```json
"matches": "^git branch\\b.*(\\s-[a-zA-Z]*[ar][a-zA-Z]*\\b|--remotes\\b|--all\\b)"
```

## 7.03 Remote-tracking branches

**7.03-A (minor). Git's refusal suggests `--detach`, and the lesson does not say what that would mean.**
Real output: `fatal: a branch is expected, got remote branch 'origin/main'` and `hint: If you want to detach HEAD at the commit, try again with the --detach option.` The content says "You cannot commit on it" and "Git refused to put you on `origin/main`". A learner who follows the hint gets a detached HEAD at that commit and can commit there; `origin/main` still does not move. The goal "main is still where it was" then also stops passing until they switch back.
Fix: append to "What just happened": "Git's hint offers `--detach`: that only visits the commit (detached HEAD), and a commit made there would still not move `origin/main`."

All three questions are correct. The `switch` refusal exit code is 128, as the goal expects.

## 7.04 Fetch

**7.04-A (minor). The range regex rejects valid ranges.** Fails: `git log HEAD..origin/main` (`04-alt.yaml`, FAIL), `git log ..origin/main`, `git log main..@{u}`, `git rev-list --count main..origin/main` (the natural way to count, `04-alt3.yaml`, FAIL).
Fix (tested: the four forms above, `origin/main ^main`, and the reference solution pass; plain `git log origin/main` fails):
```json
"matches": "^git (log|rev-list)\\b.*((main|HEAD|@)?\\.\\.(origin/main|origin|@\\{u(pstream)?\\})(\\s|$)|origin/main (\\^main|--not main)|\\^(main|HEAD) origin/main)"
```
Action: pressed 1, 2 and 3 times, before and after a fetch: the same two commits, exit 0.

## 7.05 Bring fetched work into your branch

Covered by X1. Otherwise accurate ("No new commit was made", "`origin/main` ... is still at Sam's last push").

## 7.06 Pull

**7.06-A (major). On git 2.32 and 2.33.0 a plain `git pull` on diverged branches merges (with a warning).**
The default "abort when a fast-forward is not possible" (commit `031e2f7`, "pull: abort by default when fast-forwarding is not possible") shipped in git 2.33.1. Before that, git printed "Pulling without specifying how to reconcile divergent branches is discouraged" and merged. The app allows git 2.32.0 (`src-tauri/src/commands.rs`, `MIN_GIT`). On those versions step 3 ("Read the hint and the final `fatal:` line. Nothing was merged") is false, and the hint text does not exist. The goals still pass, so the lesson finishes after teaching something untrue.
Fix: `lesson.yaml`: `minGit: "2.33.1"` (`parse_version` handles three parts). Add the row `| 7.06 | plain `pull` refuses divergent branches | 2.33.1 |` to the version table in `docs/LESSONS.md`. 7.12 and 7.17 work on 2.32 (7.17 hint 3 is then simply not needed).

**7.06-B (minor). The description of the hint is incomplete, and the hint itself steers toward `--global`.**
Real hint (2.43): three choices (`pull.rebase false`, `pull.rebase true`, `pull.ff only`), then "You can replace "git config" with "git config --global"". The content says "it wants you to choose, once, between merging and rebasing". A learner following git's advice to use `--global` changes Canopy's shared config for every later lesson. With `pull.rebase true` they also fail this lesson's merge goal.
Fix: replace the paragraph from "One wrinkle" to "the answer is merging:" with:
"One wrinkle in modern git. When your branch and the remote have both moved, plain `git pull` fetches, then stops and prints a hint: it wants you to say how to join the two histories (merge, rebase, or only fast-forward). Rebasing comes much later in this course. For now the answer is merging. Set it for this repository only, not with `--global`:"

Facts verified: the fetch half runs before the refusal (`origin/main` moves), exit code 128, and a fast-forward needs no choice.

## 7.07 Push

No findings. "the push itself told your clone where the remote now is" is right (push updates `origin/main`). The `main -> main` output was verified. The "Teammate pulls" action is harmless before the push and on any number of presses (`07-alt.yaml`, ok).

## 7.08 Rejected push

**7.08-A (major). The quoted rejection is a mix of two different git messages.**
`content.md` shows `! [rejected] main -> main (non-fast-forward)` followed by "hint: Updates were rejected because the remote contains work that you do not have locally". Real git 2.43 output in this lesson (unfetched, the reference path):
```
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs to '.../origin.git'
hint: Updates were rejected because the remote contains work that you do not
hint: have locally. This is usually caused by another repository pushing to
hint: the same ref. If you want to integrate the remote changes, use
hint: 'git pull' before pushing again.
```
`(non-fast-forward)` is printed only after a fetch, and then together with "the tip of your current branch is behind its remote counterpart". The learner is told to "read the rejection message in full" and compare.
Fix: replace the code block with:
```
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs to '.../origin.git'
hint: Updates were rejected because the remote contains work that you do not
hint: have locally. ...
```
and add after it: "If you had fetched first, git would say `(non-fast-forward)` and that your branch is behind its remote counterpart. It is the same problem."
The label "non-fast-forward rejection" stays correct as a concept name.

Goals: fetch+merge, `pull --rebase` and the reference all pass. `push --force` then pull/push fails twice (force goal, and Sam's commit is gone from origin). Exit code 1 for a rejected push was verified.

## 7.09 Upstream branches

**7.09-A (minor). "Branches you create yourself have no upstream until you set one."** Not true for branches started from a remote-tracking branch: `branch.autoSetupMerge` (default `true`) sets the upstream, which 7.11 teaches. This lesson's own setup needs `--no-track` to avoid it.
Fix: "A branch you create from a local branch has no upstream until you set one. (Starting a branch from `origin/<name>` is different; see 7.11.)" Step 4 can then read: "The branch `signage` was created from `origin/signage` with tracking turned off."

**7.09-B (nit).** `lesson.yaml` labels the teammate repo "Teammate (Priya)", but Sam pushes `main` from the same clone in setup. Use "Teammate".

Goals: `git status -s -b`, `git log @{upstream}..`, `git branch -u origin/signage signage` (from `main`), and `git push -u origin signage` (push is in `requires`) all pass.

## 7.10 Push a new branch

X3 only. The refusal text ("has no upstream branch ... `git push --set-upstream origin trail-maps`") was verified, exit 128. `git push origin trail-maps` + `git branch -u`, and `git push --set-upstream origin HEAD`, pass. `git push origin trail-maps` alone correctly fails the upstream goal.

## 7.11 Get a teammate's branch

X3 only. `switch -c signage origin/signage`, `switch --track origin/signage` and `checkout signage` all pass. `switch -c signage` with no start point correctly fails. The statements about `--guess` and a single matching remote are right.

## 7.12 Pull safely

**7.12-A (minor). A wrong approach passes: `git reset --hard origin/main` instead of merging.** It throws away the learner's own README commit, but "Make a commit of your own" (`@mark:river..main` ≥ 1) is satisfied by Sam's fix. `12-wrong-reset.yaml`: ok (should fail).
Fix (tested, now FAILS): the two extra sub-checks from X1 (`commitCount origin/main..main min 1`, `isAncestor origin/main main`) in the "Integrate Sam's fix" goal.

Also X1. The refusal text `fatal: Not possible to fast-forward, aborting.` and exit code 128 were verified with `pull.rebase false` set locally. "the fetch half ran, `origin/main` moved" is correct.

## 7.13 Delete a remote branch

**7.13-A (nit).** Step 6: "only `main` and `origin/main` remain". `git branch -a` also shows `remotes/origin/HEAD -> origin/main`. Fix: "only `main` and `origin/main` remain (plus the `origin/HEAD` pointer)."

`git push origin :winter-closures`, `--delete` before the remote name, `git branch -dr origin/scratch`, and `git remote prune origin` all pass. Deleting only locally correctly fails. The `not commitCount` workaround for "remote-tracking ref is gone" works.

## 7.14 Manage remotes

**7.14-A (minor). "upstream" means two things in one paragraph.** "What just happened" says "Renaming `origin` ... updated the upstream link of `main`", next to a remote named `upstream`. 7.09 just taught "upstream" as a branch's tracking link.
Fix: after "...is usually called `upstream`." add: "That name is only a convention. It has nothing to do with a branch's upstream from 7.09." In "What just happened", say "updated the tracking link of `main`".

**7.14-B (nit).** "rename one (its origin/* bookmarks are renamed too)" → "its `<old>/*` bookmarks".

**7.14-C (nit).** `git fetch --all` (shown in 7.04) prints "fatal: ... backup.git does not appear to be a git repository ... error: could not fetch backup" and exits 1, though `upstream` was fetched. Step 3 could add: "(`git fetch --all` would also try the dead `backup` and complain.)"

Absolute URL, `remote rm`, and add `fork` + remove `origin` + `branch -u fork/main` all pass.

## 7.15 Push and fetch tags

**7.15-A (minor). The action fails after a corrected re-push, and the goal does not notice.** Sequence: lightweight `v1.0` pushed → action (Sam gets it) → learner re-creates `v1.0` annotated and force-pushes it → action. `git fetch --tags` refuses ("would clobber existing tag"), and the action exits 1. Sam keeps the wrong tag, yet "Sam fetches and receives v1.0" passes (presence only).
Fix (tested with `15-retag.yaml`): in `actions/teammate-fetch.sh` use `git fetch -q --tags --force origin`. In `goal.json` make the teammate goal `{ "type": "tag", "repo": "teammate", "name": "v1.0", "present": true, "annotated": true, "target": "@mark:lake" }`.

**7.15-B (minor). The `--follow-tags` description is imprecise.** "annotated tags that point at commits you are pushing". git pushes annotated tags that are missing on the remote and point at commits *reachable from* the refs being pushed, including commits the remote already has. That is why `git push --follow-tags` with nothing new on `main` still publishes `v1.0` (`15-alt.yaml`, ok).
Fix: `git push --follow-tags         the branch, plus annotated tags on its history that the remote lacks`.

**7.15-C (nit).** Step 4 needs `tag -d` (5.16, `tag-manage`). Add `tag-manage` to `requires` instead of noting it as a gap.

The `fetch --prune --prune-tags` statement is correct. `git push --tags`, `--delete origin v1.0-rc` and `:refs/tags/v1.0-rc` pass. A lightweight tag correctly fails.

## 7.16 The sync routine

**7.16-A (minor). "Fetching before pushing is a habit, not a rule; the remote enforces it anyway."** This contradicts itself, and the remote enforces integration, not fetching.
Fix: "Fetching before you push is a habit, not something git forces on you. If you skip it, the remote rejects the push and sends you back to step 2."

**7.16-B (nit).** Hint 3: "that is round business as usual" → "that is business as usual".

Pressing the action three times before round 1 still lets the lesson finish (`16-alt-early.yaml`, ok). Round 2 then has nothing to integrate. That is acceptable; no change needed. Push-before-fetch (rejected, then merge) passes.

## 7.17 Boss: collaborate

**7.17-A (nit).** "The two edits touch the same place, so expect a conflict". There is no conflict if the learner merges and pushes `main` before pressing, or presses before cloning. The goals accept both (tested). Fix: "If both edits meet in one merge, expect a conflict; the final file keeps both lines."

Robust otherwise. These routes all pass: reference; merge and push first, then the action, then a fast-forward pull (`17-alt-pushfirst`); integrate on `lake-update`, then fast-forward `main` (`17-alt-onbranch`); action before cloning (`17-alt-early`); local `--no-ff` merge, then divergent pull with `--no-rebase` and a conflict (`17-alt-diverge`). Tagging `main` before integrating correctly fails the tag goal. The action is safe at every point tried: before the clone, after the learner pushed `main`, and repeated.

---

## Alternative-approach tests

Live = current lessons; Fixed = scratch copy with the fixes above.

| Lesson | Solution file | Approach | Live | Fixed |
|---|---|---|---|---|
| 7.01 | 01-alt | `clone ./origin.git work` | ok | ok |
| 7.01 | 01-wrong-bare | `clone --bare` (wrong) | FAIL (correct) | FAIL (correct) |
| 7.02 | 02-alt | `remote show`, `branch -avv`, bare `ls-remote` | FAIL (regex) | ok |
| 7.02 | 02-alt2 | `branch -vr` | FAIL (regex) | ok |
| 7.02 | 02-wrong | `branch --track x` / `-d x` instead of -r | FAIL (correct) | FAIL (correct) |
| 7.03 | 03-alt | flags in other order | ok | ok |
| 7.04 | 04-alt | `fetch origin`, `log HEAD..origin/main` | FAIL (regex) | ok |
| 7.04 | 04-alt2 | action twice, `fetch --all`, `log origin/main ^main` | ok | ok |
| 7.04 | 04-alt3 | `rev-list --count main..origin/main` | FAIL (regex) | ok |
| 7.04 | 04-wrong-pull | pull instead of fetch (wrong) | FAIL (correct) | FAIL (correct) |
| 7.04 | 04-wrong-norange | `log origin/main`, no range (wrong) | FAIL (correct) | FAIL (correct) |
| 7.05 | 05-early | action pressed before first fetch | **FAIL** | ok |
| 7.06 | 06-early | action pressed before first pull | **FAIL** | ok |
| 7.07 | 07-alt | action before and after push, `push origin main` | ok | ok |
| 7.08 | 08-alt-fetch-merge | fetch + merge | ok | ok |
| 7.08 | 08-alt-rebase | `pull --rebase` | ok | ok |
| 7.08 | 08-wrong-force | `push --force` (wrong) | FAIL (correct) | FAIL (correct) |
| 7.09 | 09-alt | `status -s -b`, `@{upstream}..`, `branch -u ... signage` | ok | ok |
| 7.09 | 09-alt2 | `push -u origin signage` | ok | ok |
| 7.10 | 10-alt | `checkout -b`, push, then `branch -u` | ok | ok |
| 7.10 | 10-alt2 | `push --set-upstream origin HEAD` | ok | ok |
| 7.10 | 10-wrong | push without upstream (wrong) | FAIL (correct) | FAIL (correct) |
| 7.11 | 11-alt / alt2 / alt3 | `switch -c x origin/x`, `switch --track`, `checkout signage` | ok | ok |
| 7.11 | 11-wrong | `switch -c signage` from main (wrong) | FAIL (correct) | FAIL (correct) |
| 7.12 | 12-early | action pressed before first pull | **FAIL** | ok |
| 7.12 | 12-wrong-reset | `reset --hard origin/main` (wrong) | **ok (should fail)** | FAIL (correct) |
| 7.13 | 13-alt | `push origin :branch`, `branch -dr` | ok | ok |
| 7.13 | 13-alt2 | `push --delete origin`, `remote prune` | ok | ok |
| 7.13 | 13-wrong | delete local refs only (wrong) | FAIL (correct) | FAIL (correct) |
| 7.14 | 14-alt | absolute URL, `fetch --all`, `remote rm` | ok | ok |
| 7.14 | 14-alt2 | add fork + remove origin + `branch -u` | ok | ok |
| 7.15 | 15-alt | `push --follow-tags`, `:refs/tags/...` | ok | ok |
| 7.15 | 15-alt2 | action first, `push --tags` after deleting rc | ok | ok |
| 7.15 | 15-retag | lightweight, then corrected annotated re-push | ok (Sam keeps wrong tag, action exits 1) | ok (Sam gets annotated tag) |
| 7.15 | 15-wrong-light | lightweight tag (wrong) | FAIL (correct) | FAIL (correct) |
| 7.16 | 16-alt | push first (rejected), merge, pull | ok | ok |
| 7.16 | 16-alt-early | action pressed 3 times before any work | ok | ok |
| 7.17 | 17-alt-pushfirst | merge + push main before the action | ok | ok |
| 7.17 | 17-alt-onbranch | integrate on lake-update, then fast-forward main | ok | ok |
| 7.17 | 17-alt-early | action before cloning | ok | ok |
| 7.17 | 17-alt-diverge | local merge, divergent pull `--no-rebase`, conflict | ok | ok |
| 7.17 | 17-wrong-tagold | tag before integrating (wrong) | FAIL (correct) | FAIL (correct) |

Action re-run checks (run directly, 3 presses each, all exit 0): 7.04, 7.05/7.06/7.12, 7.07, 7.15, 7.16 (staged as documented), 7.17. Only 7.15 fails, after a tag force-push (7.15-A).

---

## Applied (second pass, 2026-10-03)

All 4 majors, all 11 minors and the clear nits were applied to the live files, as proposed above, with one change to X1: after its two staged changes, the shared 7.05/7.06/7.12 action adds one more "Checked: ..." line to `trails/lake.md` on every later press. Sam always has something new, so even several early presses cannot dead-end the lesson (`05/06/12-early3.yaml`: three presses before the first integration, all ok). The no-op actions (7.04, 7.17) now print "Sam has nothing new to push." Not applied: 7.01 regex variants (`git -C work log`) and the 7.03 `switch -- origin/main` regex nit, which are not worth the complexity. Live results: `validate` has no 7.x errors or warnings; `test 7`: 17/17 ok; every alternative and wrong-approach solution in the table gives the "Fixed" result; every action pressed 4 times exits 0.
