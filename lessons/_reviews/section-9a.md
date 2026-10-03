# Review: section 9, part A (lessons 9.01 to 9.13)

Reviewer: independent senior review, 2026-10-03. Scope is 9.01 to 9.13 only; another reviewer covers 9.14 to 9.27. No lesson files were edited. Tested against a scratch copy of the catalog (`/tmp/claude-1000/review9a/lessons`); proposed goal JSON marked "tested" was applied to `/tmp/claude-1000/review9a/fixed` and run with the reference solution and every alternative listed at the end. Local git is 2.43.0.

## Overall verdict

This is a strong part of the section. The git semantics are almost all exact: `A..B` vs `A^..B`, oldest-first replay, `-m 1` = first parent as base, `--onto <newbase> <oldbase> <branch>`, the status text during a paused rebase, and HEAD being detached until the rebase finishes. I checked each against real git. Every goal checks rewritten commits by message, content, order, parents and `refNotAt` the original mark. None compares a learner-made hash. Equivalent routes pass: `rebase main search` from `main`, `rebase --onto main main search`, `rebase -i`, `A^..B`, listing ids, `--onto` with hashes or `main~N`, and `git -C` in 9.10.

`validate`: 225 lessons, 0 errors, no section 9 warnings. `test 9.01` to `9.13`: 13 tested, 0 failed. 72 alternative and wrong-approach runs are tabled at the end.

Main problems:
- **9.07: the skip and abort goals can be passed without ever doing the two picks.** `git cherry-pick --quit` exits 0 when nothing is in progress, and the `--skip` goal accepts any exit code, including 128 from a no-op. (major)
- **9.07: the `--quit` line in the content is incomplete.** The lesson's own goal label sends range-pickers to `--quit`, which leaves a conflicted file the content never mentions. (minor)
- **9.08 never requires `-m 1`.** Cherry-picking the feature commit, or `merge --squash`, passes. (minor)
- **9.06 (and 9.04) reject `-x`, which 9.05 has just recommended.** (minor)
- **Two accuracy slips:** 9.01 says only the message differs after an amend, and 9.13 does not say that `--onto <target> <start> <end>` with a commit id as `<end>` ends on a detached HEAD. (minor)

Counts: **0 blocker, 1 major, 5 minor, 12 nit** (the remaining 9.07 swapped-order gap is noted but not counted).

---

## Cross-cutting

**X1 (nit). The author notes are out of date on `"exitCode": null`.**
File: `lessons/_notes/section-9.md`, 9.07 bullet: "That spelling is not in the format doc".
Why: `docs/LESSON_FORMAT.md` now documents it ("`exitCode?` (default 0; `null` = any)"). The 9.07 fix below also stops using it.
Fix: delete that sentence.

**X2 (nit). Concluding a paused pick or rebase with `git commit --no-edit` gives a message that fails the `equals` checks.**
Tested: in 9.11, `git add` + `git commit --no-edit` + `git rebase --continue` fails "limits has its three commits...". The copy's message is `Lower default limit and add unit\n\n# Conflicts:\n#\tconfig.toml`: with `--no-edit`, git uses `whitespace` cleanup, so the comment lines stay. 9.07's "Raise timeout to 60" goal behaves the same way.
Why: this is real git behaviour, and the message really does contain junk. It is still a surprising failure for a valid-looking route. The text recommends `--continue`, so leave the goals as they are, but say so in the hint if it comes up in playtesting.
Fix: optional. In 9.11 hint 2, append: "Use `--continue`, not a manual commit."

---

## 9.01 Why history can be rewritten

**9.01-A (minor). "Only the message, and therefore the id, differs" is not true, and the hash description leaves out the committer.**
File `9.01/content.md`: "Its id is a hash of everything in it: the files, the message, the author, the date and the parent id." and "The replacement has the same parent and the same files as the original; only the message, and therefore the id, differs."
Why: an amend keeps the author and author date, but it records a new committer and committer date. In this lesson the committer even changes from Alex (setup) to the learner. So the id would change even with the same message (`git commit --amend --no-edit` gives a new id). A curious learner who checks with `git log --format=fuller` sees the text is wrong. This is also the idea the whole section is built on.
Fix:
- "Its id is a hash of everything in it: the files, the message, the author and the committer with their dates, and the parent id."
- "The replacement has the same parent, files and author as the original. The message differs, and so does the committer time, so the id differs."

**9.01-B (nit). "`--amend` is a shortcut for reset the branch to the parent, then commit again"** is fine as a model, but a real re-commit would also reset the author date. Optionally add "(keeping the original author)".

Goals: sound. `wrong-reset` (`reset --soft` + commit) and `wrong-noedit` both fail, as they should for a guided amend demo.

## 9.02 Fix the last commit message

**9.02-A (nit). "The same files" is checked by path only.**
File `9.02/goal.json`, goal 2 uses `commitChanges ... ["contact.html"] exact`.
Tested: `echo ... >> contact.html; git commit -a --amend -m "Add contact page"` passes (`9.02-wrong-editcontent`).
Fix: add `{ "type": "fileContent", "source": "HEAD", "path": "contact.html", "lines": ["<h1>Contact</h1>", "<p>hello@studio.example</p>"] }` to goal 2.

Note: `reset --soft HEAD~1` + commit fails because of the `usedCommand` amend check. That is intended: the lesson teaches `--amend`.

## 9.03 Add to the last commit

No findings. The content on `--reset-author` (author becomes you, with the current time) and `--date` (author date) is correct. The goals reject a second commit and a changed message. `git add -A` + `--amend -m "Add contact page"` and `--amend --no-edit --reset-author` pass. A `reset --soft` route would also pass because there is no `usedCommand`. That is acceptable for a content lesson.

## 9.04 Cherry-pick a commit

**9.04-A (nit). `-x` is rejected.**
File `9.04/goal.json`, goal 1: `{ "type": "commitMessage", "rev": "main", "equals": "Fix price rounding in cart" }`.
Tested: `git cherry-pick -x checkout~1` fails. `-x` is only taught in 9.05, so this is a nit here. The same fix matters more in 9.06.
Fix (tested): `{ "type": "commitMessage", "rev": "main", "matches": "^Fix price rounding in cart(\n|$)" }`.

Otherwise accurate. "Same message and author, ... different parent, so ... a new id" is right, and the cherry-pick applies cleanly. Merging `checkout`, picking the wrong commit, and picking while still on `checkout` all fail. `git checkout main` + a hash, and the range `checkout~2..checkout~1`, both pass.

## 9.05 Cherry-pick options

No findings. The descriptions of `-x`, `-n` and `-e` are correct. The second `-n` pick works because `-n` does not need the index to match HEAD. The goals accept either order (the `-n` picks first, then `-x`), `-n wip~1 wip` in one command, and `-n wip~2..wip`. They reject: the fix without `-x`, `-x` on all three, and everything squashed into one commit with a hand-typed "cherry picked from" line.

## 9.06 Cherry-pick a range

**9.06-A (minor). The goal rejects `-x`, one lesson after 9.05 recommends it.**
File `9.06/goal.json`, goal 1, the three `commitMessage ... equals` checks.
Tested: `git cherry-pick -x drafts~4..drafts~1` fails. 9.05 says to use `-x` "when the original is on a public branch". A learner who applies that advice here gets a goal that does not tick, with no reason given.
Fix (tested; the reference solution and all alternatives pass, all wrong approaches still fail):
```json
{ "type": "commitMessage", "rev": "main~2", "matches": "^Add post: Hello world(\n|$)" },
{ "type": "commitMessage", "rev": "main~1", "matches": "^Add post: Git tips(\n|$)" },
{ "type": "commitMessage", "rev": "main",   "matches": "^Add post: Branching(\n|$)" },
```

The semantics are exact. `A..B` excludes A, `A^..B` includes it, and the picks are applied oldest first. Listing ids out of order applies them in command-line order, and the goal catches that (`wrong-order` fails). An off-by-one range and `main..drafts~1` (which drags in the ideas draft) both fail.

## 9.07 Cherry-pick conflicts

**9.07-A (major). The skip and abort goals can be passed without doing either pick.**
File `9.07/goal.json`: "Skip the retries pick with --skip" (`usedCommand`, `"exitCode": null`) and "End the debug-logging pick with --abort (or --quit ...)" (`usedCommand`, default exit 0).
Verified with real git: with nothing in progress, `git cherry-pick --skip` exits 128 and `git cherry-pick --quit` exits **0**.
Tested: `9.07-wrong-bypass` passes the whole lesson. It runs `git cherry-pick --skip`, then `git cherry-pick --quit`, then picks and resolves only the timeout commit. Steps 2 and 3, which teach `--skip` and `--abort`, are never done.
Fix (tested): replace the `--skip` goal and add two sticky milestones that prove each pick actually stopped. `CHERRY_PICK_HEAD` resolves through `rev-parse`, and `refAt` is false when it is absent. Goal order:
```json
{ "label": "The retries pick stops on its conflict", "sticky": true, "check": { "type": "all", "checks": [
    { "type": "operation", "value": "cherry-pick" },
    { "type": "refAt", "ref": "CHERRY_PICK_HEAD", "target": "@mark:f2" } ] } },
{ "label": "Pick \"Raise retries to 5\" and skip it with --skip", "check": { "type": "any", "checks": [
    { "type": "usedCommand", "matches": "\\bgit cherry-pick\\b.*--skip" },
    { "type": "usedCommand", "matches": "\\bgit cherry-pick\\b.*--skip", "exitCode": 1 } ] } },
{ "label": "The debug-logging pick stops on its conflict", "sticky": true, "check": { "type": "all", "checks": [
    { "type": "operation", "value": "cherry-pick" },
    { "type": "refAt", "ref": "CHERRY_PICK_HEAD", "target": "@mark:f3" } ] } },
```
Insert them after the timeout goal, and keep the abort/quit goal and the final goal. Exit 1 covers the range route, where `--skip` lands straight in the next conflict. Exit 128 (a no-op) no longer counts.
Results with the fix: the reference passes. `alt-editor-resolve` and `alt-range-quit-cleanup` pass. `wrong-bypass` now fails. `wrong-range-abort` and `wrong-theirs` still fail.
Optional: for symmetry, relabel the first sticky goal "The timeout pick stops on its conflict" and add `{ "type": "refAt", "ref": "CHERRY_PICK_HEAD", "target": "@mark:f1" }`.
Remaining gap (nit, accept): `--abort` on the retries pick followed by `--skip` on the debug pick (`wrong-swapped`) still passes. The two end states are identical, so it cannot be told apart.

**9.07-B (minor). The content describes `--quit` and `--abort` incompletely, and the goal label sends learners into the gap.**
File `9.07/content.md`: "`git cherry-pick --abort   # undo the whole cherry-pick`" and "`git cherry-pick --quit    # stop, but keep what was already applied`". The goal label says "(or --quit, if you picked the three as a range)".
Verified: in the range route (`git cherry-pick main..fixes`, resolve, `--continue`, `--skip`), `--abort` resets `main` to before the range and loses the resolved timeout commit. `--quit` removes the sequencer state but leaves `settings.conf` **conflicted** in the index and working tree. Without a cleanup step, `alt-range-quit` fails the "clean tree" goal, and nothing in the lesson says why. With `git reset --hard` (or restoring the file from HEAD), it passes.
Why: the brief asks for exact `--abort`/`--quit` semantics, and this is the one place where they differ in a way the learner meets.
Fix: replace the two table lines and the paragraph after them:
```
    git cherry-pick --abort      # undo the whole command, including picks already committed
    git cherry-pick --quit       # stop here; keep the commits made so far, leave files as they are

`--skip` matters when you pick a range: it drops the one that failed and goes on with the rest. On a single pick, `--skip` and `--abort` end up in the same place. `--quit` does not clean up: a file still in conflict stays conflicted, so restore it afterwards.
```
Also add a fourth hint: "Picked all three as a range? `--abort` would also undo the timeout commit. Use `--quit`, then restore `settings.conf` from the last commit."

**9.07-C (nit).** "You have the same choices as in a merge" is not quite true, because `git merge` has no `--skip`. Change it to "the same choices as in a merge, plus one".

## 9.08 Cherry-pick a merge commit

**9.08-A (minor). The lesson never checks that `-m 1` was used.**
File `9.08/goal.json`: the tree goal checks only one new one-parent commit with `export.js` and without the docs change.
Tested: after the refusal, `git cherry-pick feature-export` passes (`wrong-nom`), and so does `git merge --squash feature-export` + commit (`wrong-squash`). The lesson title, teaches-id and question are all about `-m 1`, and the content itself calls picking the individual commit the usual alternative.
Fix (tested): add after the refusal goal:
```json
{ "label": "Cherry-pick the merge with -m 1", "check": { "type": "usedCommand", "matches": "\\bgit cherry-pick\\b.*(\\s-m\\s*1|--mainline[= ]1)(\\s|$)" } },
```
Results: `-m 1`, `-m1` and `--mainline 1` pass. `wrong-nom` and `wrong-squash` now fail. `-m 2` still fails, on the tree.

**9.08-B (nit). The refusal regex rejects any option.**
File `9.08/goal.json`, goal 1: `"^git cherry-pick +[^ -][^ ]*$"`.
Tested: `git cherry-pick -x main` (refused with exit 128) does not tick the goal.
Fix (tested): `"^git cherry-pick( +-(-[a-ln-z][a-z-]*|[a-ln-z]+))* +[^ -][^ ]* *$"`. It allows options other than `-m`/`--mainline`, and allows trailing spaces.

**9.08-C (nit).** The copy on `release` keeps the message "Merge branch 'feature-export'" although it is not a merge. That may puzzle readers. Add to "What just happened": "Its message still says 'Merge branch ...'; add `-e` to the pick if you want to reword it."

Accuracy: correct. "-m 1 means the first parent: the branch that was merged into", and the applied change is the parent-1 to merge diff. The question's wrong option 3 correctly describes `-m 2`, so it is plausible but wrong.

## 9.09 Rebase a branch

**9.09-A (nit).** "Git finds the commits on your branch that `<base>` does not have, then cherry-picks them" leaves out that commits whose change is already in `<base>` are skipped. That matters later, and here a short clause is enough: "...that `<base>` does not have (skipping any whose change `<base>` already contains)".

Goals: robust. `rebase main search` from `search` and from `main`, `rebase --onto main main search`, and `rebase -i main` with the todo unchanged all pass. `merge main`, and rebasing `main` onto `search`, both fail.

## 9.10 Rebase or merge

**9.10-A (nit).** Step 1's merge in `merge-way` is a three-way merge (`main` has its own commit), but `requires` lists only `merge-ff`. LESSONS.md has the same list, so either add `merge-three-way` to both or note the deviation in the author notes.

**9.10-B (nit).** The `merge-count` question (answer 0) is answered by the content itself ("no merge commit at all"), so it tests reading, not understanding. Optional: ask instead "How many merge commits does merge-way's main have?" (answer 1). That one needs the step 3 command to be run.

Goals: robust. `rebase main feature` + `merge --ff-only`, `merge --no-ff` in `merge-way`, the reverse folder order, and `git -C` all pass. Merging in both folders, rebasing in both, and rebasing `main` onto `feature` (which rewrites `main`) all fail.

## 9.11 Rebase conflicts

No findings beyond X2. Verified: a plain `git rebase main` on git 2.43 shows "interactive rebase in progress; onto ...", "Last commands done (2 commands done)" with the original id of the stopped commit, and "Next command to do (1 remaining command)". The content's description is exact, and `@mark:f2` is the right answer. The goals reject `--skip`, `--abort` + merge, and a `--theirs` resolution. They accept `rebase main limits` from `main` and `rebase --onto main limits~3 limits`.

## 9.12 Rebase --onto

**9.12-A (nit).** Two additions would tie the long form to what the learner knows:
- "take the commits of `<branch>` that come after `<oldbase>`" → "take the commits in `<oldbase>..<branch>` (the same range as in the log)".
- "The branch name is optional; without it, the current branch is used." → append "With it, git switches to that branch first."

Goals: robust. `--onto main api` (current branch), `--onto main ui~2 ui` from `main`, and `rebase -i main` with the two api commits dropped all pass. Plain `rebase main`, `--onto api main ui` and `--onto main main ui` fail.

## 9.13 More uses of --onto

**9.13-A (minor). The transplant form leaves out what happens when `<end>` is not a branch.**
File `9.13/content.md`: "`git rebase --onto <target> <start> <end>` moves the commits after `<start>` up to `<end>` onto `<target>`."
Verified: `git rebase --onto HEAD~4 HEAD~2 <hash-of-HEAD>` reports "Successfully rebased and updated detached HEAD". `main` is not moved and still has 6 commits. A branch only moves when `<end>` is a branch name. The brief singles out `--onto` argument meaning. A learner who transplants with a commit id as `<end>` will think the commits vanished.
Fix: "...onto `<target>`. If `<end>` is a branch, that branch moves; if it is a commit id, you end on a detached HEAD at the last copy and no branch moves."

Hints and goals: the HEAD~N counting in hint 1 is right (`--onto HEAD~4 HEAD~2` keeps c5 and c6 on c2). `main~4 main~2 main`, short hashes, and `rebase -i` with `drop` all pass. An off-by-one (`HEAD~3`, which stops on a modify/delete conflict), dropping too much (`HEAD~5`), revert, and the hash-as-`<end>` form all fail.

---

## Alternative-approach tests

All run with `canopy-lesson --lessons <copy> test <id> --solution /tmp/claude-1000/review9a/alt/<name>.yaml`. "Fixed" means the scratch copy with the proposed goal changes (9.04, 9.06, 9.07, 9.08).

| Lesson | Solution | Kind | Result (current) | Result (fixed) |
|---|---|---|---|---|
| 9.01 | alt-editor (`GIT_EDITOR=sed ... --amend`) | valid | ok | — |
| 9.01 | wrong-reset (`reset --soft` + commit) | off-lesson | FAIL (intended) | — |
| 9.01 | wrong-noedit (message not fixed) | wrong | FAIL | — |
| 9.02 | alt-editor, alt-order (`--message=... --amend`) | valid | ok | — |
| 9.02 | alt-resetsoft | off-lesson | FAIL (intended) | — |
| 9.02 | wrong-extrafile | wrong | FAIL | — |
| 9.02 | wrong-editcontent (changes contact.html) | wrong | **ok (nit 9.02-A)** | — |
| 9.03 | alt-addall-m, alt-resetauthor | valid | ok | — |
| 9.03 | wrong-second, wrong-msg | wrong | FAIL | — |
| 9.04 | alt-hash (`checkout main`, short hash), alt-range (`checkout~2..checkout~1`) | valid | ok | ok |
| 9.04 | alt-x | valid | **FAIL (nit 9.04-A)** | ok |
| 9.04 | wrong-merge, wrong-tests, wrong-stay | wrong | FAIL | FAIL |
| 9.05 | alt-twoinone (`-n wip~1 wip`), alt-reversed (`-n` picks first), alt-range-n | valid | ok | — |
| 9.05 | wrong-nox, wrong-allx, wrong-allone | wrong | FAIL | — |
| 9.06 | alt-caret (`drafts~3^..drafts~1`), alt-list (three ids) | valid | ok | ok |
| 9.06 | alt-x | valid | **FAIL (minor 9.06-A)** | ok |
| 9.06 | wrong-includedraft, wrong-offbyone, wrong-order | wrong | FAIL | FAIL |
| 9.07 | alt-editor-resolve (sed on markers) | valid | ok | ok |
| 9.07 | alt-range-quit-cleanup (range, `--quit`, `reset --hard`) | valid | ok | ok |
| 9.07 | alt-range-quit (no cleanup) | incomplete | FAIL (see 9.07-B) | FAIL |
| 9.07 | wrong-bypass (no-op `--skip`/`--quit`, one pick) | wrong | **ok (major 9.07-A)** | FAIL |
| 9.07 | wrong-range-abort (abort undoes the first pick) | wrong | FAIL | FAIL |
| 9.07 | wrong-theirs | wrong | FAIL | FAIL |
| 9.07 | wrong-swapped (abort retries, skip debug) | wrong | ok (nit, same end state) | ok |
| 9.08 | alt-checkout (`-m1`), alt-mainline (`--mainline 1 <hash>`) | valid | ok | ok |
| 9.08 | alt-refusal-flag (`cherry-pick -x main` refused) | valid | **FAIL (nit 9.08-B)** | ok |
| 9.08 | wrong-m2 | wrong | FAIL | FAIL |
| 9.08 | wrong-nom (pick feature commit), wrong-squash | off-lesson | **ok (minor 9.08-A)** | FAIL |
| 9.09 | alt-twoarg, alt-twoarg-from-main, alt-onto, alt-interactive | valid | ok | — |
| 9.09 | wrong-merge, wrong-reversed (rebase main onto search) | wrong | FAIL | — |
| 9.10 | alt-ffonly (`rebase main feature`, `--ff-only`, `--no-ff`), alt-gitC | valid | ok | — |
| 9.10 | wrong-bothmerge, wrong-bothrebase, wrong-rebasemain | wrong | FAIL | — |
| 9.11 | alt-twoarg-sed (from main, `rebase main limits`), alt-onto | valid | ok | — |
| 9.11 | alt-commit-then-continue (`commit --no-edit`) | valid-ish | FAIL (nit X2: "# Conflicts" kept in message) | — |
| 9.11 | wrong-skip, wrong-abort-merge, wrong-ours | wrong | FAIL | — |
| 9.12 | alt-current, alt-relative (`ui~2`, from main), alt-interactive-drop | valid | ok | — |
| 9.12 | wrong-plain, wrong-swapped, wrong-mainbase | wrong | FAIL | — |
| 9.13 | alt-explicit (`main~4 main~2 main`), alt-hash, alt-interactive (drop) | valid | ok | — |
| 9.13 | wrong-offbyone, wrong-tooMuch, wrong-revert, wrong-hashend (detached) | wrong | FAIL | — |

With the proposed goal changes applied: `canopy-lesson --lessons /tmp/claude-1000/review9a/fixed test 9.04 9.06 9.07 9.08` gives 4 tested, 0 failed, and `validate` gives 0 errors.
