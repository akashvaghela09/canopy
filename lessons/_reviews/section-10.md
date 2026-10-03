# Review: section 10, Recovery (lessons 10.01 to 10.13)

Reviewer: independent senior review, 2026-10-03, git 2.43.0. No lesson files were edited. Every fix marked "tested" was applied to a scratch copy (`/tmp/claude-1000/review10/fixed`) and run through `canopy-lesson test --lessons <copy>` with the reference solution and all the alternative solutions in `/tmp/claude-1000/review10/alt/`. With all the goal fixes applied, `validate` reports 0 errors and `test 10` reports 13 tested, 0 failed.

## Overall verdict

This is a strong section. The scenarios are realistic and small, each lesson has one idea, and the git behaviour is almost all correct. I checked the following against real git on the setup repos:
- the reflog numbering in 10.02 (`main@{3}` is "Write chapter 2" and `HEAD@{3}` is "Add research notes");
- the date selectors in every time zone from UTC-12 to UTC+14;
- the reflog line text quoted in 10.01, 10.05 and 10.06;
- the `fsck --lost-found` output in 10.09 and 10.13 (`--lost-found` turns reflogs off, so reflog-only commits show as dangling);
- the defaults in 10.11: 90 days, 30 days and 2 weeks.

`validate`: 0 errors and no warnings for section 10. `test 10`: 13 tested, 0 failed.

Main problems:
- **10.08 setup runs a shell command by accident.** Backticks inside double quotes are run as a command. Setup prints `exporter: command not found`, and the file the learner restores reads "Run  to write all rows as CSV." (major)
- **10.13 rejects `git stash store <id>` without `-m`**, although its own hint offers `stash store` as a route. (major)
- **The section never mentions the graph's gray and dashed commits.** Lesson 5.11 promised that section 10 would show how to get gray commits back. 10.07 says "Only main's four commits are visible", but the graph panel shows two gray ones. (minor)
- **10.11's story does not match its setup.** The 2024 clock already puts the lost entry past the 30-day default, so `git gc --prune=now` alone destroys the commit (tested). The text also says the 2-week prune grace starts after the reflog entry expires. It starts at the object file's mtime, which is how 14.14 explains it. (minor)
- **Some goals are loose or narrow.** 10.04's merge goal accepts any merge commit (`merge --no-ff origin/main` passes). The `^git reflog\b` goals reject `git log -g`. 10.07 rejects cherry-picked copies on a new branch. (minor)

Counts: **0 blocker, 2 major, 18 minor, 21 nit.**

On "every valid route" (lead's focus):
- The following pass wherever they apply: reflog by number (`HEAD@{n}`), by branch (`main@{1}`, `<branch>@{1}`), `ORIG_HEAD`, a raw id, `switch -c`/`checkout -b` from the reflog, `branch -f` from another branch, and `merge --ff-only HEAD@{1}`.
- Cherry-pick routes make *copies* with new ids. They fail in 10.03, 10.05, 10.06 and 10.13, whose curriculum checks ask for the original tip or ids. They pass in 10.08 and 10.10, which check content.
- I recommend accepting them in 10.07 (fix tested), and keeping 10.03/10.05/10.06/10.13 strict with labels that say "original" (X3). This is a judgment call for the lead.

---

## Cross-cutting

**X1 (minor). The "read the reflog" goals reject `git log -g` / `git log --walk-reflogs`.**
Files: `10.01`, `10.03`, `10.05`, `10.06`, `10.07`, `10.11` `goal.json`. Each has `"matches": "^git reflog\\b"`.
Tested: `10.01-logg` (`git log -g --oneline`) and `10.05-logg` both fail only this goal.
Why: `git log -g` prints the same reflog. A learner who already knows it is rejected.
Fix (tested in all six lessons): `"matches": "^git\\s+(reflog\\b|log\\b.*\\s(-g|--walk-reflogs)\\b)"`.

**X2 (minor). The section ignores the graph's gray and dashed commits, and one sentence contradicts the panel.**
The graph draws commits that only HEAD's reflog knows in gray, and rewritten originals dashed (`snapshot.rs`, "Reflog-only commits ... as ghosts"). 5.11 tells learners: "the graph draws them gray ... section 10 shows how to get such commits back". Sections 9.x use "ghosted". Section 10 never says either word. LESSONS.md's "ghost trail" visual for 10.01 now partly exists in this form, so the author's note "no panel id" is out of date.
Concrete errors:
- `10.07/content.md` step 1: "Draw the graph. Only `main`'s four commits are visible." The terminal log shows four, but the graph panel shows six (two gray).
- `10.05/content.md` step 1 and `10.06/content.md` step 4 do not mention the dashed or gray commits the learner will see.

Fixes:
- 10.01, end of step 1: "Only Monday and Tuesday are left in the log. The graph still shows Wednesday and Thursday in gray: commits that only the reflog remembers."
- 10.07 step 1: "Draw the graph in the terminal: only `main`'s four commits are listed. The graph panel also shows two gray commits; those are the experiment, which only the reflog still remembers."
- 10.05 step 1, append: "In the graph panel the original three commits are still there, dashed: rewritten originals."
- 10.06 step 4: "Draw the graph: the three gray draft commits are back in color, on their own branch."
- 10.11 step 4, append: "The gray commit is gone from the graph too."

**X3 (minor). Cherry-picked copies: decide per lesson, and say so in the labels.**
Tested:
- 10.03 (`cherry-pick HEAD..HEAD@{1}`) fails.
- 10.06 (`switch -c` + cherry-pick of the three) fails.
- 10.07 (`switch -c physics <Add jumping>` + cherry-pick of both) fails.
- 10.08 and 10.10 pass, because they check content.

10.03, 10.05, 10.06 and 10.13 are right to require the originals: the curriculum says "branch back at the lost tip" or "ids match". But the labels "main is back on \"Add health endpoint\"" and "feature/drafts points at \"Add draft autosave\"" read as satisfied by a copy with that message.
Fix:
- 10.03 label: "main is back on the original \"Add health endpoint\" commit". Add to "What just happened": "Cherry-picking the three commits would also bring the work back, but as copies with new ids; moving the label back keeps the originals."
- 10.06 label: "feature/drafts points at the original \"Add draft autosave\" commit".
- For 10.07, see 10.07-C.

**X4 (nit). The author notes are partly out of date.**
`lessons/_notes/section-10.md` says "Ordering ... cannot be enforced". It can now, with `last: true` inside a sticky `all` (10.11-F does this). The note about the 10.01 ghost trail is also out of date (X2). The claim that cherry-picking in 10.08 "is not a step because the amended commit shares most of its content" is wrong: it applies cleanly (10.08-B).

**X5 (nit). Labels say "before", but nothing enforces the order.**
- 10.03 "Read the reflog before moving anything" passes for `reset --hard ORIG_HEAD` followed by `git reflog` (tested, `10.03-reset-before-reflog`). Enforcing it would trap learners who use ORIG_HEAD first. Relabel to "Read the reflog".
- 10.11 should enforce the order (10.11-F).

---

## 10.01 The safety net

**10.01-A (nit). The negative goal penalises a learner who recovers on their own.** `goal.json`: "main stays where the reset left it (recovery comes next lesson)".
Tested: `10.01-recover-early` (`reset --hard HEAD@{1}`) fails the lesson.
Why: a curious learner who undoes the reset has to reset the lesson. The answers already cover the intent.
Fix: delete the goal. If the lead wants to keep it, the label is clear enough.

**10.01-B (minor).** See X2: step 1 should point at the two gray commits.

The reflog text in the `entry` options matches git exactly ("reset: moving to HEAD~2"). The answers are right.

## 10.02 Address the past

**10.02-A (minor). "This draft was written in March 2024" is ambiguous.** `content.md`, end of paragraph 3.
Why: a learner can read "this draft" as the lesson text rather than the book draft in the repo. The point being made is about the reflog's timestamps.
Fix: "The reflog entries in this practice repo were written in March 2024, so relative forms like these all land on the current tip here; use an explicit date instead."

**10.02-B (nit). The gloss on `main@{yesterday}` is imprecise.** "What just happened": "`main@{yesterday}` is \"whatever main was before I started\"". Git reads `yesterday` as exactly 24 hours ago (checked: `rev-parse --since=yesterday` gives now − 86400).
Fix: "`main@{yesterday}` is where main pointed 24 hours ago, often the last state before a bad morning."

**10.02-C (nit). The date-goal regex accepts only ISO dates.** `"matches": "@\\{[^}]*2024-03"`. Tested: `main@{March 10 2024}` and `main@{13 Mar 2024 12:00}` resolve correctly but fail the goal (`10.02-alt-wordsdate`).
Fix (tested; the reference solution and both alternatives pass): `"matches": "@\\{[^}]*(\\d{4}|ago|yesterday|today|noon|midnight)[^}]*\\}"`.

**10.02-D (nit).** The content opens with `HEAD~3` (`relative-refs` is in `requires`). It is a contrast, not a step, so this is acceptable. Noting it only for recall-rule strictness.

Verified: `main@{3}` = d, `main@{2024-03-10}` = c, `main@{2024-03-13T12:00}` = d in Pacific/Kiritimati (UTC+14) and Etc/GMT+12 (UTC-12). `HEAD@{3}` = "Add research notes". `main@{yesterday}` and `main@{1.year.ago}` both give the tip, as the text says.

## 10.03 Undo a bad reset

**10.03-A (minor).** Cherry-pick label and text: see X3.
**10.03-B (nit).** The "before moving anything" label is not enforced: see X5.

The goals are solid. `ORIG_HEAD`, `main@{1}`, a raw id and `merge --ff-only HEAD@{1}` all pass. `reset --soft` (unclean tree) and `checkout HEAD@{1}` (detached) are rejected.

## 10.04 ORIG_HEAD

**10.04-A (minor). The merge goal accepts any merge commit, not a merge of `experiment`.**
Tested: `10.04-wrong-noff-origin` (pull, undo, `git merge --no-ff --no-edit origin/main`, undo) passes every goal, and `experiment` is never merged.
Fix (tested): add `{ "type": "isAncestor", "ancestor": "@mark:exp-tip", "descendant": "HEAD" }` to the "Merge experiment into main" `all`.

**10.04-B (minor). Neither undo is checked on its own.** "Undo with reset --hard ORIG_HEAD" is satisfied by either reset. "main ends back on \"Add logging\"" passes at start. So the lesson never checks that the pull was undone before the merge. In practice the merge onto Sam's commits conflicts on `config.py`, which steers the learner, but the goals do not say so.
Fix (tested): add two state-based sticky goals that accept every undo route. After any reset, ORIG_HEAD holds the tip it came from. The existing usedCommand goal stays, so ORIG_HEAD must still be used at least once.
```json
{ "label": "Undo the pull (main back on \"Add logging\", Sam's commits only on origin/main)", "sticky": true,
  "check": { "type": "all", "checks": [
    { "type": "currentBranch", "name": "main" },
    { "type": "refAt", "ref": "main", "target": "@mark:before" },
    { "type": "refAt", "ref": "ORIG_HEAD", "target": "@mark:pushed" } ] } },
{ "label": "Undo the merge", "sticky": true,
  "check": { "type": "all", "checks": [
    { "type": "currentBranch", "name": "main" },
    { "type": "refAt", "ref": "main", "target": "@mark:before" },
    { "type": "commitParents", "rev": "ORIG_HEAD", "count": 2 } ] } }
```
Insert the first after "Undo with reset --hard ORIG_HEAD" and the second after "Merge experiment". Results:
- pass: the reference solution, `10.04-fetchmerge-reflog` (fetch + merge, undo with `HEAD@{1}`) and `10.04-pullff-head1` (undo the merge with `HEAD~1`);
- fail: `10.04-wrong-noff-origin` and `10.04-wrong-pull-noff`.

**10.04-C (nit).** Step 2: "Sam's commits are back behind `origin/main`." Replace with "`main` is two commits behind `origin/main` again; Sam's commits are still there, on `origin/main`."

**10.04-D (nit).** `rebase` is in `requires` but has no step. The author recorded this deviation; that is fine.

The content is accurate: ORIG_HEAD is written by merge, pull, rebase and reset, `HEAD~1` lands mid-pull after a fast-forward, and the reflog is the fallback.

## 10.05 Undo a finished rebase

**10.05-A (minor). The ORIG_HEAD condition is wrong.** `content.md`: "`ORIG_HEAD` also points there, as long as nothing else has moved HEAD since the rebase."
Why: commits, switches and checkouts move HEAD without touching ORIG_HEAD. Only merge, pull, rebase, reset (and am) overwrite it. Learners will apply the wrong rule later.
Fix: "`ORIG_HEAD` also points there, until the next merge, pull, rebase or reset overwrites it. The reflog entry keeps working either way."

**10.05-B (nit). "The copies sit unreferenced until the reflog forgets them."** After the reset, the copies are still referenced by `feature/search@{1}` and by HEAD's reflog.
Fix: "The copies are now the ones only the reflog remembers (gray in the graph) until it forgets them."

**10.05-C (nit).** Add one sentence after the `git reflog show feature/search` block: "HEAD's own reflog has a line for every copied commit, so `HEAD@{1}` is one of the copies; the branch's reflog is the easier one to read here." Tested: `reset --hard HEAD@{1}` fails correctly (`10.05-wrong-head1`), and `HEAD@{5}` passes.

The goals are good. `ORIG_HEAD`, `HEAD@{5}`, and `switch main` + `branch -f feature/search feature/search@{1}` + switch back all pass. `rebase --onto main~1 wip-styles` (new ids) is correctly rejected.

## 10.06 Recover a deleted branch

**10.06-A (nit).** `branch -D` prints `Deleted branch feature/drafts (was <id>).` That is the quickest way back, the same idea 10.10 uses for `stash drop`. Add to "What just happened": "`branch -D` printed the tip's id when it deleted the branch; if it is still on screen, that id is all you need."
**10.06-B (minor).** Label: see X3.

`switch -c ... HEAD@{1}` and `checkout -b ... <sha>` pass. `HEAD@{2}` and the cherry-picked copies are rejected.

## 10.07 Recover detached-HEAD commits

**10.07-A (minor). Wrong direction in step 2.** "Find the \"checkout: moving from ... to main\" line ... The two \"commit:\" lines above and below confirm it." The checkout line is the top line (`HEAD@{0}`), and both commit lines are below it.
Fix: "The two \"commit:\" lines just below it confirm it."

**10.07-B (minor).** "Only `main`'s four commits are visible" is false for the graph panel: see X2.

**10.07-C (minor). A cherry-picked copy on a new branch is rejected.** Tested: `10.07-cherrypick-branch` (`switch -c physics <Add jumping>` + `cherry-pick` of both commits) fails "\"Tune jump height\" is on a branch again". The curriculum check is "commit reachable from a branch", but the learner's real goal is to get the experiment back on a branch, and copies on the same base do that.
Fix (tested): accept the original or copies with both messages on some branch.
```json
{ "label": "\"Tune jump height\" is on a branch again",
  "check": { "type": "any", "checks": [
    { "type": "reachable", "rev": "@mark:exp-tip" },
    { "type": "shell", "script": "s=$(git log --branches --format=%s) && grep -qx 'Tune jump height' <<<\"$s\" && grep -qx 'Experiment with gravity' <<<\"$s\"" } ] } }
```
The validator then warns "uses a shell check". If the lead prefers strict originals, keep the check as it is and change the label to "The original \"Tune jump height\" commit is on a branch again".

**10.07-D (nit).** `git tag physics HEAD@{1}` passes "is on a branch" (`reachable` defaults to heads, tags, remotes and HEAD). It does save the work. Either accept that, or relabel the goal "is reachable from a branch or tag again".

## 10.08 Find the pre-amend version

**10.08-A (major). Setup runs a command by accident, and the restored file is broken.** `setup.sh` line 9:
```bash
write docs/export.md "# Export" "" "Run `exporter export out.csv` to write all rows as CSV."
```
The backticks inside double quotes are command substitution. Setup prints `exporter: command not found` to stderr, and the file in every commit reads `Run  to write all rows as CSV.` (two spaces, no command). The learner restores and reads exactly this file. The goal still passes because it only checks "write all rows as CSV".
Fix (tested; no stderr, file correct):
```bash
write docs/export.md "# Export" "" 'Run `exporter export out.csv` to write all rows as CSV.'
```
A check in `setup-lib.sh` or the harness that fails on setup stderr would catch this kind of bug.

**10.08-B (minor). The cherry-pick advice is misleading, and cherry-pick actually works here.** Bullet: "**The whole content was replaced:** cherry-pick `HEAD@{1}` to get the old change as a new commit on top."
Tested: `git cherry-pick HEAD@{1}` applies cleanly in this lesson and passes every goal (`10.08-cherrypick`). It adds "Add export command" again with `docs/export.md`. If the amend really had replaced the content, re-applying the old commit's diff on top would conflict wherever both touched the same lines.
Fix: "**You want the old commit's change back as its own commit:** cherry-pick `HEAD@{1}`. Git re-applies the old commit on top; where the amend changed the same lines, you resolve a conflict." Optionally add to step 3: "(cherry-picking `HEAD@{1}` also works here)". That gives `cherry-pick` in `requires` a real use.

**10.08-C (minor). The "look" goal accepts only `HEAD@{1}`.** Tested: `git show --stat main@{1}` + `git restore --source=main@{1}` fails "Look at the commit as it was before the amend" (`10.08-main1`).
Fix (tested): `"matches": "^git\\s+((show|diff|log|restore|checkout)\\b.*@\\{1\\}|reflog\\b|log\\b.*\\s(-g|--walk-reflogs)\\b)"`.

**10.08-D (nit).** Hint 2 gives `git restore --source=...`, but the restore skill from 4.03 is not in `requires`. Add it, or leave it, since hints may give commands.

Verified: `commit --amend` does not write ORIG_HEAD (the text does not claim it does). `reset --hard HEAD@{1}` alone and `reset --soft HEAD@{1}` are both correctly rejected.

## 10.09 Dangling objects

**10.09-A (minor). "Dangling" and "unreachable" are blurred, and the reflog behaviour is missing.**
Text: "An object nothing points to is **dangling** ... `--unreachable` prints everything that no ref reaches, including trees."
Why:
- Real git output in this lesson: `--lost-found` prints 2 lines, while `--unreachable` prints 5, including the lost commit's tree and `ideas.md` blob. Those are pointed to (by the lost commit), so the text's definition does not explain why `--lost-found` skips them.
- `--unreachable` also honours reflogs, while `--lost-found` ignores them. In a normal repo, `--lost-found` therefore lists commits the reflog still knows. In 10.13 it lists the deleted login tip and the pre-rebase api-v2 tip as dangling.
Fix, replacing the sentence and the `--unreachable` sentence:
"An object that no ref and no reflog entry reaches is **unreachable**. The unreachable objects that not even another unreachable object points to (the top of each lost pile) are **dangling**.
... `--unreachable` prints every unreachable object, including the trees and blobs inside a lost commit. `--lost-found` ignores the reflog, so in an everyday repo it also lists commits the reflog still remembers."

The question options and the blob recovery are right. `fsck --unreachable` + `cat-file -p` and `cp .git/lost-found/other/*` both pass. Restoring the wrong unreachable blob (`ideas.md`) is rejected.

## 10.10 Recover a dropped stash

**10.10-A (minor). `app.js` versus `app.py`.** Step 4: "`styles.css` and `app.js` have the dark-mode edits again". Hint 3 says the same. Setup and the goal use `app.py`.
Fix: replace `app.js` with `app.py` in both places.

**10.10-B (nit).** The code block shows `git fsck --unreachable` and `git stash apply`, both from `requires` skills. The new idea, `apply` with a raw id plus `grep commit`, justifies showing them. Acceptable.

Results:
- pass: `stash store -m` + `pop`, `checkout <id> -- files`, and `cherry-pick -n -m 1 <id>`;
- fail: applying the "index on main" commit (git refuses it as "not a stash-like commit"), `stash pop` of the tooltips entry, and `cherry-pick -m 1` without `-n` ("main did not move").

## 10.11 When recovery stops

**10.11-A (minor). The config step is not what destroys the commit in this setup, and the text half-admits it.**
Tested: `git gc --prune=now` alone, with no config change, deletes `@mark:lost`. It fails only the "Shorten" goal (`10.11-gc-only`). The lost entry is dated 2024-05-28, already past the 30-day default. The last paragraph explains this for reachable entries only, so a careful learner is left wondering whether step 2 did anything.
Fix, last paragraph: "You may have noticed that the whole reflog is empty now. This repo's entries were written in 2024, so all of them were already older than both defaults; `git gc --prune=now` alone would have removed the lost commit here. In a repo you work in today, the entry is days old, and step 2 is what lets `gc` remove it."

**10.11-B (minor). The grace period is described wrongly, and 14.14 contradicts it.** "a dropped commit survives about 30 days in the reflog and then two more weeks as a loose object before `gc` prunes it."
Why: `gc.pruneExpire` (2.weeks.ago) is measured from the object file's mtime, not from when the reflog entry expired. 14.14 says this correctly ("measured from the object file's modification time"). By day 30 a loose object is usually older than two weeks, so the next real `gc` prunes it at once. Tested: with the config set, plain `git gc` keeps the object here only because setup wrote the file minutes ago (`10.11-config-gc-plain`).
Fix: "With the defaults, a dropped commit stays in the reflog for about 30 days. After that, the next `gc` deletes it, unless its object file is less than two weeks old (`gc.pruneExpire`)."
Also fix the earlier sentence "(its own default keeps them another two weeks)" to "(by default it spares objects written in the last two weeks)".

**10.11-C (minor). Nothing warns against `--global`, and a global setting follows the learner into later lessons.**
Tested: `git config --global gc.reflogExpireUnreachable now` + `gc --prune=now` destroys the commit and fails only the "Shorten" goal. The setting stays in Canopy's global config, and any later `gc` (for example in 14.13 or 14.14) then expires unreachable entries immediately.
Fix, step 2: "Set `gc.reflogExpireUnreachable` to `now` in this repo's local config, not with `--global`: a global setting would follow you into every later lesson."

**10.11-D (nit).** Hint 3 says `git show <old id>` fails with "bad object". That is true for the full id. With the short id from the reflog, git says `fatal: ambiguous argument '8d7f551': unknown revision or path not in the working tree.`
Fix: "... fails (\"bad object\" for a full id, \"unknown revision\" for a short one)".

**10.11-E (nit).** The "Prune" regex rejects `git prune`, which prunes every unreachable loose object (tested: `reflog expire --expire-unreachable=now --all` + `git prune` removes the commit but fails the goal).
Fix (tested): `"matches": "^git\\s+(gc\\b.*--prune=(now|all)|prune\\b)"`. This also stops `gc --prune` with no value, which keeps the 2-week default, from passing.

**10.11-F (nit). Enforce "Read the reflog before expiring it".** This is the one place where order matters and is checkable.
Fix (tested; the reference solution and `10.11-reflog-expire` pass, `10.11-gc-first` fails):
```json
{ "label": "Read the reflog before expiring it", "sticky": true,
  "check": { "type": "all", "checks": [
    { "type": "usedCommand", "last": true, "matches": "^git\\s+(reflog\\b|log\\b.*\\s(-g|--walk-reflogs)\\b)" },
    { "type": "fileInRev", "path": "README.md", "rev": "@mark:lost", "present": true } ] } }
```

**10.11-G (nit).** `gc.reflogExpireUnreachable` covers "entries for commits that nothing reaches any more". Git's rule is "not reachable from that ref's *current tip*". A HEAD entry for a commit on another branch counts as unreachable even though a branch reaches it.
Fix: "entries for commits that are no longer in that ref's current history, which includes the \"lost\" kind."

The question answers are correct (90 days, 30 days, expire + prune both needed), and the destructive flag and first sentence are right.

## 10.12 Choose the right rescue

**10.12-A (nit). Case 4 rejects `git stash store`, which 10.10 suggests and 10.13 accepts.** Tested: `10.12-store-only` fails.
Fix (tested):
```json
{ "label": "Case 4: the retry logic is back (in client.py or in the stash list)",
  "check": { "type": "all", "repo": "case4-stash", "checks": [
    { "type": "any", "checks": [
      { "type": "fileContent", "path": "client.py", "contains": "RETRIES" },
      { "type": "fileContent", "source": "stash@{0}", "path": "client.py", "contains": "RETRIES" } ] },
    { "type": "refAt", "ref": "main", "target": "@mark:c4-main" } ] } }
```
Also change "and the stash content back in the working tree of case 4" in the content to "and the stash content back (working tree or stash list) in case 4".

**10.12-B (nit).** "an hour of edits to `report.py` were discarded" should be "was discarded".

The mixed routes pass: `main@{1}`, `switch -c`, `ORIG_HEAD` for case 3, `stash store` + `pop`, `branch -f` from main, and `checkout <id> -- client.py`. `reset --hard HEAD@{1}` in case 3 (a rebase copy) is rejected. Case 5 really leaves nothing: `fsck --lost-found` prints nothing and the reflog shows no move.

## 10.13 Boss: disaster drill

**10.13-A (major). `git stash store <id>` without `-m` fails, but hint 3 offers `stash store` as a route.**
Tested: `10.13-store-nomsg` fails "The cart-totals work is back". Without `-m`, the stash list entry reads `Created via "git stash store".`, and the `stash` check matches `messageContains` against that reflog subject.
Fix (tested; passes with and without `-m`, the reference solution passes, and apply-then-hard-reset still fails): check the stash's content instead of its list message.
```json
{ "label": "The cart-totals work is back (in cart.py or in the stash list)",
  "check": { "type": "any", "checks": [
    { "type": "fileContent", "path": "cart.py", "contains": "def total" },
    { "type": "fileContent", "source": "stash@{0}", "path": "cart.py", "contains": "def total" } ] } }
```

**10.13-B (nit).** "main is back on \"Add webhooks\"" wraps a single check in `all`. Unwrap it.

**10.13-C (nit).** A natural order trap: applying the stash first and then `reset --hard HEAD@{1}` wipes `cart.py` again (tested, `10.13-apply-then-reset`). It is recoverable, so it is fine for a boss. Optional hint 3 addition: "Bring the stash back last: a hard reset afterwards would wipe it from the working tree again."

The goals are otherwise robust:
- pass: `ORIG_HEAD` for main, `switch -c` for login, switch + `reset --hard feature/api-v2@{1}`, and a pure-`fsck --lost-found` route (it lists the stash, login tip and api-v2 original as three dangling commits);
- fail: `branch -f feature/api-v2 ORIG_HEAD`, because ORIG_HEAD holds main's tip.

---

## Alternative-approach tests

All runs use `./target/debug/canopy-lesson test -v <id> --solution /tmp/claude-1000/review10/alt/<file>.yaml`. The "Fixed copy" column uses `--lessons /tmp/claude-1000/review10/fixed`.

| Lesson | Solution file | Approach | Kind | Current | Fixed copy |
|---|---|---|---|---|---|
| 10.01 | reflog-show | `reflog show main` + `log main@{1}` | valid | ok | ok |
| 10.01 | logg | `git log -g` instead of `git reflog` | valid | FAIL (Read the reflog) | ok |
| 10.01 | wrong-wed | answers Wednesday | wrong | FAIL | FAIL |
| 10.01 | recover-early | recovers with `reset --hard HEAD@{1}` | valid-ish | FAIL (main stays) | FAIL (10.01-A: delete goal) |
| 10.02 | alt | `rev-parse main@{3}`, unquoted `main@{2024-03-10}`, `"main@{2024-03-13 12:00}"` | valid | ok | ok |
| 10.02 | alt-wordsdate | `log -g`, `main@{March 10 2024}`, `main@{13 Mar 2024 12:00}` | valid | FAIL (@{date}) | ok |
| 10.03 | orig | `reset --hard ORIG_HEAD` | valid | ok | ok |
| 10.03 | main1 | `reset --hard main@{1}` | valid | ok | ok |
| 10.03 | ffmerge | `merge --ff-only HEAD@{1}` | valid | ok | ok |
| 10.03 | sha | `reset --hard <sha>` | valid | ok | ok |
| 10.03 | reset-before-reflog | ORIG_HEAD first, reflog after | order | ok (label says "before") | ok (relabel, X5) |
| 10.03 | cherrypick | `cherry-pick HEAD..HEAD@{1}` (copies) | copies | FAIL | FAIL (by design, X3) |
| 10.03 | wrong-soft | `reset --soft HEAD@{1}` | wrong | FAIL | FAIL |
| 10.03 | wrong-checkout | `checkout HEAD@{1}` (detached) | wrong | FAIL | FAIL |
| 10.04 | fetchmerge-reflog | fetch + merge, undo with `HEAD@{1}`, merge, ORIG_HEAD | valid | ok | ok |
| 10.04 | pullff-head1 | `pull --ff-only`, ORIG_HEAD, merge, undo with `HEAD~1` | valid | ok | ok |
| 10.04 | wrong-checkout-orig | detours through a detached ORIG_HEAD, ends with `HEAD~1` | valid-ish | ok | ok |
| 10.04 | wrong-noff-origin | `merge --no-ff origin/main` instead of experiment | wrong | **ok (bug)** | FAIL |
| 10.04 | wrong-pull-noff | `pull --no-ff` | wrong | FAIL | FAIL |
| 10.04 | skip-undo-pull | merges onto Sam's commits (conflict), aborts | wrong | FAIL | FAIL |
| 10.05 | orig | `reset --hard ORIG_HEAD` | valid | ok | ok |
| 10.05 | headn | `reset --hard HEAD@{5}` | valid | ok | ok |
| 10.05 | branchf | `switch main`, `branch -f ... @{1}`, switch back | valid | ok | ok |
| 10.05 | logg | `log -g feature/search` | valid | FAIL (Read a reflog) | ok |
| 10.05 | wrong-head1 | `reset --hard HEAD@{1}` (a copy) | wrong | FAIL | FAIL |
| 10.05 | wrong-rebase-onto | `rebase --onto main~1 wip-styles` (new ids) | wrong | FAIL | FAIL |
| 10.06 | switchc | `switch -c feature/drafts HEAD@{1}` | valid | ok | ok |
| 10.06 | checkoutb-sha | `checkout -b feature/drafts <sha>` | valid | ok | ok |
| 10.06 | cherrypick | new branch + cherry-pick of 3 (copies) | copies | FAIL | FAIL (by design, X3) |
| 10.06 | wrong-head2 | `branch feature/drafts HEAD@{2}` | wrong | FAIL | FAIL |
| 10.07 | switchc | `switch -c physics HEAD@{1}` | valid | ok | ok |
| 10.07 | cherrypick-branch | `switch -c physics <jump>` + cherry-pick of 2 | copies | FAIL | ok (10.07-C) |
| 10.07 | tag | `tag physics HEAD@{1}` | wrong-ish | ok | ok (10.07-D) |
| 10.07 | wrong-head0 | `branch physics HEAD@{0}` | wrong | FAIL | FAIL |
| 10.07 | wrong-detach-only | `switch --detach HEAD@{1}` | wrong | FAIL | FAIL |
| 10.08 | checkout-amend | `checkout HEAD@{1} -- path` + `amend --no-edit` | valid | ok | ok |
| 10.08 | reset-reamend | `reset --hard HEAD@{1}` + `amend -m` | valid | ok | ok |
| 10.08 | cherrypick | `cherry-pick HEAD@{1}` | valid | ok | ok |
| 10.08 | main1 | `show`/`restore` with `main@{1}` | valid | FAIL (Look at) | ok |
| 10.08 | wrong-reset-only | `reset --hard HEAD@{1}` only | wrong | FAIL | FAIL |
| 10.08 | wrong-soft | `reset --soft HEAD@{1}` | wrong | FAIL | FAIL |
| 10.08 | wrong-not-committed | restores but does not commit | wrong | FAIL | FAIL |
| 10.09 | unreachable-catfile | `fsck --unreachable` + `cat-file -p` | valid | ok | ok |
| 10.09 | cp-lostfound | `cp .git/lost-found/other/*` | valid | ok | ok |
| 10.09 | wrong-ideas-blob | restores the `ideas.md` blob | wrong | FAIL | FAIL |
| 10.10 | store-pop | `stash store -m` + `pop` | valid | ok | ok |
| 10.10 | checkout-files | `checkout <id> -- files` | valid | ok | ok |
| 10.10 | cherrypick-n | `cherry-pick -n -m 1 <id>` | valid | ok | ok |
| 10.10 | wrong-index-commit | applies the "index on main" commit | wrong | FAIL | FAIL |
| 10.10 | wrong-pop-tooltips | `stash pop` (wrong entry) | wrong | FAIL | FAIL |
| 10.10 | wrong-cherrypick-commit | `cherry-pick -m 1` (commits WIP) | wrong | FAIL | FAIL |
| 10.11 | reflog-expire | `reflog expire --expire-unreachable=now --all` + `gc --prune=now` | valid | ok | ok |
| 10.11 | expire-prune | `reflog expire ...` + `git prune` | valid | FAIL (Prune) | ok |
| 10.11 | gc-only | `gc --prune=now`, no config (commit still destroyed) | shortcut | FAIL (Shorten) | FAIL (10.11-A text) |
| 10.11 | global | `config --global ...` + gc | wrong | FAIL (Shorten) | FAIL (10.11-C text) |
| 10.11 | config-gc-plain | config + plain `gc` (2-week grace keeps the object) | wrong | FAIL | FAIL |
| 10.11 | gc-first | gc before reading the reflog | order | n/a | FAIL (10.11-F) |
| 10.12 | mixed | `main@{1}`, `switch -c`, ORIG_HEAD, `store -m` + `pop` | valid | ok | ok |
| 10.12 | orig-case1-cp-case4 | ORIG_HEAD, raw id, `branch -f`, `checkout <id> -- file` | valid | ok | ok |
| 10.12 | store-only | case 4 via `stash store -m` only | valid | FAIL | ok (10.12-A) |
| 10.12 | wrong-case3-head1 | case 3 `reset --hard HEAD@{1}` | wrong | FAIL | FAIL |
| 10.13 | store-msg | ORIG_HEAD, `switch -c`, switch + reset `@{1}`, `store -m` | valid | ok | ok |
| 10.13 | lostfound-only | everything from `fsck --lost-found` ids | valid | ok | ok |
| 10.13 | store-nomsg | `stash store <id>` without `-m` | valid | **FAIL** | ok (10.13-A) |
| 10.13 | apply-then-reset | applies the stash, then hard-resets main | wrong order | FAIL | FAIL |
| 10.13 | wrong-orig-api | `branch -f feature/api-v2 ORIG_HEAD` | wrong | FAIL | FAIL |

The reference solutions pass in both the current lessons and the fixed copy (`test 10`: 13 tested, 0 failed). The only goals that pass at start are guard goals ("untouched", "clean", "on branch"), and every lesson has at least one goal that fails at start.

## Other checks

- Clock: every setup reflog entry is dated 2024, which is older than both expiry defaults. Nothing in section 10 runs `gc` except 10.11. Auto-gc (after commit, merge, rebase or fetch) does nothing below its loose-object threshold, so the safety net survives in every lesson. Relative selectors (`@{yesterday}`, `@{1.year.ago}`) resolve to the tip in setup repos, as 10.02 says.
- The graph's ghost logic reads only HEAD's reflog (latest 50 entries). Dropped stashes (10.10, 10.12 case 4) and expired reflogs (10.09) therefore show no gray commits. The content never claims they do, but the X2 text additions should stay out of 10.09 and 10.10.
