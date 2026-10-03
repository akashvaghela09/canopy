# Review: section 6, Merging (lessons 6.01 to 6.17)

Reviewer: independent senior review, 2026-10-03. No lesson files were edited. Every goal fix marked "tested" was applied to a scratch copy (`/tmp/claude-1000/review6/lessons`) and run with `canopy-lesson test --lessons <copy>`, using the reference solution and the alternative solutions in the table at the end. Git behaviour was checked with real git 2.43.0 on lesson states kept by `tools/lesson-try.py --keep`.

## Overall verdict

The section is in good shape. The lessons are short and concrete, and they build well from fast-forward to the boss. Every conflict is deterministic. Each one is either a same-line edit or an edit to adjacent lines, which xdiff always treats as a conflict, and I confirmed each by hand. The ours/theirs wording is correct for a merge (HEAD is ours, the merged branch is theirs). The `-m 1` explanation is correct. `-X ours` vs `restore --ours` is explained correctly.

- `validate`: no errors or warnings for 6.x (the 6 errors reported are in 12.x and 14.x).
- `test 6`: 17 tested, 0 failed.
- Commit questions (coordinator's request): 6.02 has three and 6.12 has one. None can be answered by copying a name from the prompt: `HEAD^1`, `HEAD^2`, `main~2` and `MERGE_HEAD` are all rejected now (tested, see table). No question needs `allowRefs`. Each asks the learner to find a specific commit, so a hash is the right answer.

Four statements of git behaviour are wrong or leave out something that matters. These are the majors:
- **6.15** says that merging a branch again after it was "fixed up" brings nothing ("Already up to date"). It brings the new commits, and here it produces a modify/delete conflict (verified).
- **6.09** says `git merge --continue` "also checks that nothing is left unresolved", as if `git commit` did not. Both refuse with the same error (verified).
- **6.16** teaches `--no-commit` as "stop before committing" without the caveat that a fast-forward still happens (verified).
- **6.10** calls `--abort` "safe at any point ... including after you have started editing", but the edits are silently discarded (verified).

On goal robustness, the resolution goals in 6.09, 6.13 and 6.17 are too loose. They use `contains`, so they also accept a file that keeps the old line next to the new one. 6.13 also rejects `git restore --conflict=diff3`, which is the course's own preferred command family. All fixes below are tested.

Counts: **0 blocker, 4 major, 10 minor, 11 nit.**

---

## Cross-cutting

**X1 (nit). Learners can type `@mark:<name>` as an answer to a commit question.**
File: `crates/canopy-core/src/check.rs`, the `QuestionKind::Commit` branch (`is_mark` is accepted from any input, not only from solution.yaml).
Why: a learner who has read a setup script (for example in the repo, or shared online) can type `@mark:base`. The risk is low, but the docs say marks are for solutions.
Fix: accept `@mark:` only when the harness submits the answer, or leave it and note it in LESSON_FORMAT.md. This is engine work, not lesson work.

**X2 (nit). `-s ours` is never mentioned in section 6.**
It is taught in 15.x (`merge-strategy-ours`). Learners often mix up `-X ours` and `-s ours`, and 6.16 is the first place they meet "ours" as a merge option. See 6.16-C.

---

## 6.01 Merge, fast-forward

**6.01-A (nit).** `content.md`: "Nothing was created, so there is nothing to undo later; a fast-forward only moves a label." A fast-forward can be undone (by moving the label back, see the 6.14 warning). The sentence suggests it cannot.
Fix: "Nothing was created; a fast-forward only moves a label."

**6.01-B (nit).** Hint 1 is about step 2 (switch) and hint 2 is about step 1 (the range). Swap them so they follow the steps.

Goals: robust. `--ff-only` passes, and so does `reset --hard add-soup` (it is state-equivalent, which is acceptable). `--no-ff` correctly fails.

## 6.02 Three-way merge

**6.02-A (nit).** Hint 3 gives the merge-base answer outright ("Add menu"). Hints may do this, but this question is the lesson's main check. Suggested hint 3: "The merge base is the last commit before the two lanes split. Find it on the graph and use its id."

Goals: robust. Merging in the wrong direction and then fast-forwarding (`main` into `opening-hours`, then fast-forward `main`) correctly fails, because the parents are in the wrong order. Ref-name answers (`HEAD^1`, `HEAD^2`, `main~2`) are rejected.

## 6.03 Merge commit messages

**6.03-A (nit).** `goal.json` matches `^Merge search feature into main` case-sensitively. `merge search feature into main` fails. Add `(?i)` to that regex, as 6.06 does for its message.

Goals: robust to order, to `--message=`, to amending after the merge, and to `--edit`. An octopus merge correctly fails.

## 6.04 Force a merge commit

No findings. `--no-ff --no-commit` followed by a commit passes. A plain merge (fast-forward) correctly fails.

## 6.05 Refuse non-trivial merges

No findings. Answering in the other order (hotfix first, then the refused redesign) passes. A real merge of redesign correctly fails. The refusal text and exit code 128 are correct for 2.43.

## 6.06 Squash merge

No findings. The question is correct (`branch -d` checks ancestry, not content). `branch --delete` followed by `-d -f` passes. A true merge correctly fails. "Like the state after a soft reset" is a fair comparison.

## 6.07 Read merges in history

**6.07-A (nit).** The `last-merged` question accepts only `hotfix`. Add `"Merge branch 'hotfix'"` and `"branch hotfix"`, since learners read the answer off the merge message.

The counts were verified: 3 merges, 9 first-parent commits, 4 non-merge commits by Sam. An alternative using `--format=%s`, `| wc -l` and `--author="Sam Chen"` passes.

## 6.08 Your first conflict

**6.08-A (minor). The conflict goal is not sticky.** `goal.json`, goal 1 ("Start the merge of new-title and hit the conflict").
Why: a learner who answers everything and then aborts or resolves (a natural reflex, and the next lesson's topic) cannot finish the lesson. Tested: solution `6.08-past` fails.
Fix (tested): add `"sticky": true` to goal 1.

**6.08-B (minor). "Check the status / look at the diff during the conflict" pass when run before the merge.** Tested: `6.08-wrong` (status and diff first, then merge) passes.
Why: the labels say "during the conflict". The answers mostly cover the intent, so this is not a blocker. The format has no "command run while state X" check.
Fix: change the labels to "Check the status" and "Look at the diff", or leave as is and record it in the notes as a format gap.

**6.08-C (minor). The combined-diff description is incomplete.** `content.md` step 5: "marked with `++` and `+ `".
Real output (verified):
```
++<<<<<<< HEAD
 +<h1>Hilltop Cafe and Bakery</h1>
++=======
+ <h1>The Hilltop</h1>
++>>>>>>> new-title
```
Our side is marked ` +` (space first) and theirs `+ `. The text names only two of the three prefixes, so a learner cannot match the first content line.
Fix: "Look at the diff too: during a conflict it has two columns of `+`, one per side. ` +` lines come from your side, `+ ` lines from the other branch, and `++` lines (the markers) are in neither."

**6.08-D (nit).** If the learner later sets `merge.conflictstyle` globally (13.x), this lesson's markers gain a `|||||||` section and no longer match the example. Optional: setup could run `local_config merge.conflictstyle merge` in this lesson and in 6.09 to 6.12.

## 6.09 Resolve a conflict

**6.09-A (major). False difference between `commit` and `merge --continue`.** `content.md`: "`git merge --continue` does the same as the commit and also checks that nothing is left unresolved."
Why: `git commit` refuses unresolved files too, with the same message and exit code 128 (verified: "Committing is not possible because you have unmerged files" for both). Learners will believe plain `commit` can record markers.
Fix: "`git merge --continue` does the same; it only works while a merge is in progress. Either one refuses while a file is still unresolved."

**6.09-B (minor). The resolution goal accepts leftover lines.** Goal "tagline.txt reads ..." uses `contains`. Tested: a file with both `Fresh bread every morning` and `Fresh bread and pastries every morning` passes (`6.09-wrong`).
Fix (tested; the reference solution, a version with no trailing newline, and a version with a trailing period pass; the duplicate fails):
```json
{ "label": "tagline.txt reads \"Fresh bread and pastries every morning\"", "check": { "type": "fileContent", "path": "tagline.txt", "source": "main", "matches": "\\A\\s*Fresh bread and pastries every morning\\.?\\s*\\z" } }
```
The curriculum says "keeping the content the goal specifies", so one exact line is the right target here. The regex still tolerates trailing newlines and a period.

## 6.10 Abort a merge

**6.10-A (major). "`--abort` is safe at any point" is misleading.** `content.md`, last paragraph: "`--abort` is safe at any point of a paused merge, including after you have started editing a conflicted file, since it restores the files git had checked out before."
Why: it throws away those edits without a prompt (verified: an edited `menu.md` comes back as main's version). "Safe" reads as "keeps my work". Also, `git merge --abort` docs warn that uncommitted changes from *before* the merge may not be reconstructable.
Fix: "`--abort` works at any point of a paused merge, even after you have started editing a conflicted file. Those edits are thrown away with the rest of the attempt. Start merges with a clean working tree: if you had uncommitted changes before merging, git may not be able to restore them."

Goals: robust. Editing before the abort passes. `reset --hard` followed by a failed `--abort` correctly fails.

## 6.11 Choose a side, and unusual conflicts

No findings on accuracy. These were all verified: the four conflict kinds, "your version is already on disk" for deleted-by-them, the other branch's version left on disk for deleted-by-us, and `restore --ours` = HEAD during a merge.

Goals: `checkout --ours/--theirs`, `checkout cleanup -- CHANGELOG.md`, `checkout HEAD -- styles.css`, `restore --ours` on the modify/delete file, and `merge --continue` all pass. The trap `git add -A` keeps `legacy.py` (git leaves their version on disk) and correctly fails. Three of the four file goals pass at start, but the merge goal does not. That is by design and recorded in the notes.

## 6.12 Inspect a merge in progress

**6.12-A (nit).** The final goal checks `main^2` but not `main^1`. Add `{ "type": "refAt", "ref": "main^1", "target": "@mark:main-tip" }` for parity with 6.09 and 6.11.

**6.12-B (nit).** Both conflicts are adjacent-line conflicts (an inserted line next to a changed line). They are deterministic, but they surprise learners who think "different lines merge cleanly". One sentence would help in step 1: "Two files conflict, though each side changed different lines: changes on touching lines also conflict."

Verified: `log --merge` shows 3 commits (`search1`, `main1`, `main2`), and `ls-files -u` shows stages 1/2/3. Answering `MERGE_HEAD` to the commit question is rejected (tested).

## 6.13 See the common ancestor in conflicts

**6.13-A (minor). `git restore --conflict=diff3` is rejected.** Goal 1 regex starts with `^git checkout`. `restore` has supported `--conflict=<style>` since 2.23, and the course teaches `restore` over `checkout`. Tested: `6.13-restore` fails.
Fix (tested):
```json
"matches": "^git (checkout|restore)\\b.*(--conflict[= ]z?diff3\\b.*config\\.ini|config\\.ini.*--conflict[= ]z?diff3\\b)"
```
Optionally add to content: "(`git restore --conflict=diff3 <file>` does the same.)"

**6.13-B (minor). The resolution goal accepts the old name line, a dropped `currency`, and a leftover `=======`.** Tested: a file with both `name = Hilltop Cafe` and `name = Hilltop Cafe and Bakery` and no `currency` line passes (`6.13-wrong`).
Fix (tested; the reference solution and a reordered version with no trailing newline using zdiff3 pass, `6.13-wrong` fails): append to the `checks` of goal 4:
```json
{ "type": "not", "check": { "type": "fileContent", "path": "config.ini", "source": "main", "matches": "(?m)^name = Hilltop Cafe\\s*$" } },
{ "type": "fileContent", "path": "config.ini", "source": "main", "contains": "currency = EUR" },
{ "type": "fileContent", "path": "config.ini", "source": "main", "notContains": "=======" }
```
This still accepts any line order and any whitespace at the end of lines.

**6.13-C (minor). The marker labels differ between the two methods, but the text shows only one.** The example (`<<<<<<< ours`, `||||||| base`, `>>>>>>> theirs`) is exactly what `checkout --conflict=diff3` writes (verified). A merge run with the config set writes `<<<<<<< HEAD`, `||||||| 64dbc26` (the base commit's id) and `>>>>>>> rename`. A learner who sees the second form at the next conflict may think it is a different feature.
Fix: add after the example: "`checkout --conflict` labels the sections `ours`, `base` and `theirs`. During a merge with the config set, they show `HEAD`, the base commit's id and the branch name instead."

Other checks: the zdiff3 wording is acceptable (zdiff3 moves lines that both sides share at the edges of the hunk out of it). It changes nothing here, verified. `minGit` not being set is fine.

## 6.14 Undo a local merge

**6.14-A (nit).** "After a fast-forward ... `HEAD~1` is one of the branch's own commits". This is not true when the branch had a single commit, because then `HEAD~1` is the old tip. Fix: "`HEAD~1` is usually one of the branch's own commits".

Goals: `reset --hard ORIG_HEAD` and `reset --keep HEAD^1` pass. A revert with `-m 1` correctly fails. The question is correct.

## 6.15 Revert a merge commit

**6.15-A (major). The "merge again" trap is described wrongly for a fixed-up branch.** `content.md`: "Suppose the branch is fixed up later and you merge it again. Git sees that the branch's commits are **already ancestors** of `main` and merges nothing: 'Already up to date'."
Why: if the branch has new fix-up commits, git merges those new commits, not nothing. It brings only the fixes, and the changes removed by the revert stay removed. Verified on this lesson's repo: after reverting, one commit on `promo` editing `promo.html`, then `git merge promo`, the result is `CONFLICT (modify/delete): promo.html deleted in HEAD and modified in promo`. "Already up to date" happens only when the branch has nothing new, as in the exercise. The caller asked for revert-of-merge to be exactly right, and this is the core claim.
Fix (replace the paragraph):
"That leads to a trap. The branch's commits are now **ancestors** of `main`, so git counts them as merged. Merge the branch again and git brings in only commits made since, if any; with nothing new it says "Already up to date". The changes your revert removed stay removed. If the branch got fixes and you merge them, they land on top of code that is not there, often as conflicts. To bring the work back, **revert the revert** first, which re-applies the changes, and only then merge whatever is new."

**6.15-B (minor).** `content.md`: "The history now has three extra commits: the merge, its revert, and the revert of the revert." The merge was already there in setup. The learner added two commits, and the goal checks for exactly two.
Fix: "History now tells the whole story in three commits: the merge, its revert, and the revert of the revert."

**6.15-C (nit).** "Once a merge has been shared, you cannot reset it away" should be "you should not reset it away; other people already have it".

Other checks: the `-m 1` and mainline explanation is correct. `Reapply "..."` is from 2.43 and the goal accepts both titles. Alternatives: `--mainline 1 <hash>` with the editor, then `revert HEAD`, passes. Wrong approaches correctly fail: `reset --hard HEAD~1` in place of revert-the-revert, and `cherry-pick -m 1 <merge>` (wrong title).

## 6.16 Merge options

**6.16-A (major). `--no-commit` does not stop a fast-forward.** `content.md`: "`git merge --no-commit <branch>`: do the merge but stop before committing, so you can inspect or adjust the result."
Why: for a branch that is strictly ahead, git fast-forwards anyway and there is nothing to inspect (verified: `merge --no-commit` printed `Fast-forward` and moved the branch). The git docs say this explicitly. The curriculum's "preview a merge before committing" task depends on it. The lesson's `footer` happens to be diverged, so the exercise works, but the rule as taught is wrong.
Fix: append to that bullet: "If the merge would be a fast-forward, git fast-forwards anyway, since there is no merge commit to hold back; add `--no-ff` to stop in that case too."

**6.16-B (nit).** The `-X ours/theirs` bullet should also say that `-X` settles only conflicting *lines* in files both sides edited. A modify/delete conflict (from 6.11) still stops the merge. Suggested addition: "It does not settle conflicts like deleted-by-them; those still stop the merge."

**6.16-C (nit).** Add one sentence to keep `-X ours` apart from the strategy taught later: "Do not confuse `-X ours` with `-s ours`: the strategy `ours` ignores the other branch's changes entirely and keeps your tree as it is." This is accurate and points ahead to 15.x.

**6.16-D (nit).** The `ignore-space-change` bullet says "do not count whitespace-only differences as conflicts". The git docs say lines whose only change is whitespace are treated as unchanged. A line that changed whitespace *and* content still conflicts. Suggested wording: "treat lines whose only change is whitespace as unchanged, so a reformatting on one side does not conflict with real edits on the other."

Goals: robust. `-Xtheirs` and `--strategy-option=theirs` pass, in either order and with `merge --continue`. Wrong approaches correctly fail: `-X ours`, and a hand-resolved `pricing` merge without `-X` (the `usedCommand` requires it, which is right for this lesson). The setup is deterministic: the coffee line conflicts, and the toast and cake changes are separated by unchanged lines (verified).

## 6.17 Boss: integrate three features

**6.17-A (minor). The tea-line goal accepts leftover lines.** Tested: a `menu.md` with both `- Tea 2.00 (also iced)` and `- Tea 2.20 (also iced)` passes (`6.17-wrong2`). `=======` is not checked.
Fix (tested; the reference solution, `alt1` with no trailing newline in a different order, and the `alt2` revert variant pass; `wrong2` fails): append to goal 2's `checks`:
```json
{ "type": "not", "check": { "type": "fileContent", "path": "menu.md", "source": "main", "matches": "(?m)^- Tea 2\\.00" } },
{ "type": "fileContent", "path": "menu.md", "source": "main", "notContains": "=======" }
```

**6.17-B (minor). `merge-undo-reset` is listed, but the task undoes a squash commit, which is an ordinary one-parent commit.** The task is a plain `reset --hard HEAD~1` (4.09), so the merge-specific idea (first parent of a merge) is not exercised. Either:
- (a) leave the task and replace `merge-undo-reset` with `reset-hard` in `requires`, or
- (b) undo the `search` merge instead, which would need the conflict goal to be sticky.

(a) is simpler and keeps the boss as it is.

Order robustness: squash, then undo, then nav, then search passes, and so does a revert in place of the reset. Merging search before nav correctly fails (two merge commits).

---

## Alternative-approach tests

Run with `./target/debug/canopy-lesson test <id> --solution /tmp/claude-1000/review6/<file>`. "Live" means the current lessons; "fixed" means the scratch copy with the tested fixes above.

| File | Approach | Expect | Live | Fixed |
|---|---|---|---|---|
| 6.01-alt1 | `merge --ff-only add-soup` | pass | ok | |
| 6.01-alt2 | `checkout main; reset --hard add-soup` | pass (state-equivalent) | ok | |
| 6.01-wrong | `merge --no-ff` | fail | FAIL | |
| 6.02-alt1 | `merge -m ...`, @mark answers | pass | ok | |
| 6.02-wrong | merge main into opening-hours, then fast-forward main | fail | FAIL | |
| 6.02-refans | answers `HEAD^1`, `HEAD^2`, `main~2` | fail | FAIL (rejected) | |
| 6.03-alt1 | theme first, `--message=` | pass | ok | |
| 6.03-alt2 | `--no-edit`, then `commit --amend -m`, `--edit` | pass | ok | |
| 6.03-wrong | octopus merge | fail | FAIL | |
| 6.04-alt1 | `--no-ff --no-commit`, then commit | pass | ok | |
| 6.04-wrong | plain merge (fast-forward) | fail | FAIL | |
| 6.05-alt1 | hotfix first, flag after the branch name | pass | ok | |
| 6.05-wrong | real merge of redesign | fail | FAIL | |
| 6.06-alt1 | `export --squash`, `--delete`, `-d -f` | pass | ok | |
| 6.06-wrong | true merge with `-m` | fail | FAIL | |
| 6.07-alt1 | `--format=%s`, `wc -l`, `--author="Sam Chen"` | pass | ok | |
| 6.08-alt1 | `--no-edit`, `status --short`, `diff index.html` | pass | ok | ok |
| 6.08-wrong | status and diff before the merge | fail | **ok** (6.08-B) | ok |
| 6.08-past | abort after answering | pass | **FAIL** (6.08-A) | ok |
| 6.09-alt1 | no trailing newline, `merge --continue` | pass | ok | ok |
| 6.09-alt2 | trailing period, `add -A`, `commit -m` | pass | ok | ok |
| 6.09-wrong | old and new line both kept | fail | **ok** (6.09-B) | FAIL |
| 6.10-alt1 | edit, then abort | pass | ok | |
| 6.10-wrong | `reset --hard`, then a failed `--abort` | fail | FAIL | |
| 6.11-alt1 | `checkout --ours/--theirs`, `merge --continue` | pass | ok | |
| 6.11-alt2 | `checkout cleanup --`, `checkout HEAD --`, `restore --ours` on modify/delete | pass | ok | |
| 6.11-wrong | `add -A` (keeps legacy.py) | fail | FAIL | |
| 6.12-alt1 | `ls-files --unmerged`, `rev-parse MERGE_HEAD`, `--ours` | pass | ok | |
| 6.12-refans | answer `MERGE_HEAD` | fail | FAIL (rejected) | |
| 6.13-alt1 | `restore` + `checkout --conflict=zdiff3 --`, zdiff3 config, reordered lines | pass | ok | ok |
| 6.13-restore | only `restore --conflict=diff3` | pass | **FAIL** (6.13-A) | ok |
| 6.13-wrong | old name kept, currency dropped | fail | **ok** (6.13-B) | FAIL |
| 6.14-alt1 | `reset --hard ORIG_HEAD` | pass | ok | |
| 6.14-alt2 | `reset --keep HEAD^1` | pass | ok | |
| 6.14-wrong | `revert -m 1` | fail | FAIL | |
| 6.15-alt1 | `--mainline 1 <hash>`, with editor, `revert HEAD` | pass | ok | |
| 6.15-wrong | `reset --hard HEAD~1` in place of revert-the-revert | fail | FAIL | |
| 6.15-wrong2 | `cherry-pick -m 1 <merge>` to reapply | fail | FAIL | |
| 6.16-alt1 | footer first with `merge --continue`, `-Xtheirs` | pass | ok | |
| 6.16-alt2 | `--strategy-option=theirs`, flag after the branch name | pass | ok | |
| 6.16-wrong | `-X ours` | fail | FAIL | |
| 6.16-wrong2 | hand-resolved pricing, no `-X` | fail | FAIL | |
| 6.17-alt1 | squash and undo first, then `--ff-only nav`, search | pass | ok | ok |
| 6.17-alt2 | nav, squash, search, then revert the squash | pass | ok | ok |
| 6.17-wrong | search before nav (two merges) | fail | FAIL | |
| 6.17-wrong2 | old tea line left in | fail | **ok** (6.17-A) | FAIL |

With the fixes, the reference solutions still pass: `test 6.08 6.09 6.13 6.17 --lessons /tmp/claude-1000/review6/lessons` gives 4 tested, 0 failed.
