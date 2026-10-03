# Review: section 8, Stashing and worktrees (lessons 8.01 to 8.10)

Reviewer: independent senior review, 2026-10-03. No lesson files were edited. Every change marked "tested" was applied to a scratch copy of `lessons/` (`/tmp/claude-1000/review8/lessons`). That copy passes `canopy-lesson validate` with no errors in section 8 (the remaining errors belong to sections 12, 14 and 15) and `canopy-lesson test 8` (10 tested, 0 failed). The alternative and wrong solutions listed at the end are in `/tmp/claude-1000/review8/*.yaml`. Git used: 2.43.0.

## Overall verdict

This is a good section. The garden-planner fixtures are small, deterministic and realistic. The stash and worktree semantics are almost all right: pop keeps the entry on conflict, `-u`/`--all`/`--keep-index` are described correctly, `stash show` defaults to a diffstat of `stash@{0}`, one branch per worktree, and remove vs prune. I checked each of these against real git on the built fixtures. On the live tree, `validate` reports nothing for section 8 and `test 8` gives 10 ok.

The main problems:

- **8.02's `allowRefs` question gives away its answer.** The correct answer is `stash@{1}`. The prompt's own example (`stash@{2}`) is wrong, so copying from the prompt fails (tested). But the content's code block and both hints show `git stash show stash@{1}`, so copying from the lesson text passes. (major)
- **8.07 accepts the wrong approach the lesson warns about.** A branch made from `main` (`switch -c retry-limit`, pop, settle the conflict) passes, because `newer~1` is `base`, which matches the "one commit above base" alternative. (major, tested)
- **8.10 can be passed without a stash or a worktree.** Stage only `lib.py` and commit. The boss then exercises nothing from section 8. (major, tested)
- **8.10 rejects a `--no-ff` merge of the hotfix**: `commitChanges` on a merge commit sees no paths. (minor, tested)
- Several minor goal gaps: 8.04 does not check that README stayed out of the stash, 8.05 rejects `-k` and can be fooled by moving the draft by hand, and 8.09 accepts `rm -rf` in place of `worktree remove`. All of these were tested and fixed in the copy.
- Text slips: in 8.05, "the stash holds the rest" is wrong, because the stash holds the staged change too. 8.08 says the staging area is shared. 8.08 also says the boss asks you to merge `hotfix`. 8.09 quotes "already checked out", but git 2.42+ says "already used by worktree".

Counts: **0 blocker, 3 major, 12 minor, 16 nit.**

On the lead's specific questions:
- *Pop vs apply on conflict:* correct in 8.03 and 8.06. Real output: `CONFLICT ... The stash entry is kept in case you need it again.` with exit 1.
- *`-u` / `--all` / `--keep-index`:* correct. The "test the staged part, then pop" workflow in 8.05 works: after `--keep-index`, `pop` applies cleanly and leaves `config.toml` staged and `app.py` modified (verified). The only error is "the stash holds the rest" (8.05-C).
- *What `stash show` shows by default:* "which files that entry changes, and by how much" (a diffstat) for `stash@{0}` is correct. It does not show the untracked part of a `-u` stash by default (8.05-F).
- *Worktree rules:* correct overall. The refusal exits 128 and leaves no folder. `worktree remove` on the deleted `scratch` also succeeds (exit 0). The goals accept that route, which is right.
- *8.02 `allowRefs`:* see 8.02-A.

---

## 8.01 Park your work

Git facts, goals and question are fine. The wrong approach (`git restore .`, then switch) fails as it should. `stash push -m` and `checkout` variants pass.

**8.01-A (nit). The graph description does not match the app.**
`content.md`: "In the graph it appears as a small entry off to the side."
The app draws a `stash@{n}` label on the commit the stash was made on (`src/graph/layout.ts` around line 283) and a "Stashes" strip under the graph (`GraphPane.tsx` line 101).
Fix: "In the graph it appears as a `stash@{0}` label on the commit it was made on, and in the Stashes strip under the graph."

## 8.02 Look at your stashes

The answers are correct. In the fixture, all three entries read `WIP on main: 7918ab8 Add planner skeleton`, and `stash show stash@{1}` lists only `config.toml`.

**8.02-A (major). The `commit` question with `allowRefs: true` can be answered by copying text from the lesson.**
With `allowRefs`, the checker resolves any revision (`check.rs` `QuestionKind::Commit`). The answer is `stash@{1}`, and that exact string appears in:
- `content.md`: `git stash show stash@{1}       which files that entry changes` and `git stash show -p stash@{1}`
- `lesson.yaml` hint 1: "`git stash show stash@{1}` shows which files one entry touches."
- hint 2: "`git stash show -p stash@{1}`"

The prompt's own example (`stash@{2}`) is the wrong entry, so copying from the prompt fails (tested: `802-wrong-prompt-example` FAIL). Even so, a learner who types the name from the code block gets it right without inspecting anything. Brute force over three entries is unavoidable with free retries. Moving the answer away from the lesson's examples at least means that a correct answer reflects the lesson's work.
Fix (tested):
- `setup.sh`: make the `config.toml` stash the oldest. Swap the first two `write ... ; git stash -q` blocks, so the config edit is stashed first and the app.py edit second, and change the last line to `mark cfg-stash 'stash@{2}'`.
- `goal.json` prompt: `"Which stash entry changes config.toml? Answer with its name, in the form stash@{n}."`
- hint 2: "Add `-p` to see the actual diff: `git stash show -p stash@{n}`."
- `solution.yaml`: replace `git stash show -p stash@{1}` with `git stash show -p stash@{2}`.
- Optional: in hint 1 and in the content, `stash@{1}` can stay as the example, because it is now a wrong entry.
Tested: typing `stash@{1}` now fails, and `stash@{2}` plus the hash prefix pass.

**8.02-B (minor). The theme answer rejects common variants.**
`theme="dark"` (without spaces) is rejected (tested).
Fix: `"accept": ["dark", "\"dark\"", "'dark'", "theme = \"dark\"", "theme=\"dark\"", "theme = dark", "theme=dark"]` (tested).

**8.02-C (nit).** "A stash entry is stored as a commit (two, in fact: one for the index, one for the working tree)". With `-u` there is a third commit, and 8.05 relies on that. Fix: "(two or three, in fact: one for the index, one for the working tree, and one for untracked files if you asked for them)".

**8.02-D (nit).** The goal "Look inside a stash with stash show" is always satisfied by the `-p` command that the next goal requires, so it adds nothing. Keep it if the checklist is wanted, or drop it.

## 8.03 Bring a stash back

Correct. Tested passes: pop-then-apply, and apply both then `drop stash@{0}`. Tested failure as it should: `pop stash@{1}` then `apply`.

**8.03-A (nit).** "If applying fails, for instance because of a conflict, `pop` does not drop the entry either." On a conflict, the apply does not fail: the changes land with markers. Fix: "If the apply stops on a conflict, `pop` keeps the entry too. That case has its own lesson."

**8.03-B (nit).** Nothing in the section says that `apply`/`pop` bring changes back unstaged unless you add `--index`. One line would help: "Changes come back unstaged; add `--index` to restore what was staged as staged."

## 8.04 Name stashes and stash by path

Variants pass: `push app.py -m ...`, `git stash -m ... -- app.py`, and `--message=... app.py`.

**8.04-A (minor). The goals do not check that README.md stayed out of the stash.** That is the curriculum check ("only those files stashed").
Wrong approach that passes (tested `804-wrong`): `git stash push -m "export wip"` (both files), then `git restore --source=stash@{0} --worktree README.md`. The stash then holds README too.
Fix (tested): goal 2 becomes
```json
{ "label": "The stash holds the app.py change and nothing from README.md", "check": { "type": "all", "checks": [
    { "type": "fileContent", "path": "app.py", "source": "stash@{0}", "contains": "def export" },
    { "type": "fileContent", "path": "README.md", "source": "stash@{0}", "notContains": "python3" }
  ] } }
```

## 8.05 Untracked and ignored files

The git facts check out: plain stash leaves the draft, `-u` takes it, `debug.log` stays, `--all` would take it, and `--keep-index` followed by pop works cleanly.

**8.05-A (minor). `git stash -k` is rejected.** The regex `^git stash\b.*--keep-index` misses the short form (tested FAIL).
Fix (tested): `"matches": "^git stash\\b.*(--keep-index|\\s-[a-zA-Z]*k)"`. This accepts `-k`, `-uk` and `--keep-index`. The wrong approach (`stash push -- app.py`) still fails.

**8.05-B (minor). The sticky "-u" goal can be passed by moving the draft away by hand.**
Tested `805-wrong-mv`: `mv notes/draft.md ..`, then plain `git stash`. That passes.
Fix (tested): add to the sticky `all`:
`{ "type": "fileInRev", "path": "notes/draft.md", "rev": "stash@{0}^3", "present": true }`
The third parent is the untracked-files commit. `--all` still passes.

**8.05-C (minor). Step 5 is inaccurate.** "`app.py` is back to the committed version, and the stash holds the rest."
With `--keep-index`, the stash holds both changes. `git stash show` lists `app.py` and `config.toml` (verified). Only the working tree keeps the staged part.
Fix: "...`app.py` is back to the committed version, and the stash holds both changes (the staged one is also still in place)."

**8.05-D (nit).** "Untracked files are outside git's view." Git does see them, and status lists them. Fix: "Untracked files are not in any commit yet, so a stash has to be told to include them."

**8.05-E (nit, notes).** `lessons/_notes/section-8.md` says "Order of commands cannot be checked." That is false. A sticky `all` of a `usedCommand` plus a "before" state enforces order (see X2 in `section-3-4.md`). No change to 8.05 is needed; correct the note.

**8.05-F (nit).** `git stash show` does not list the untracked part of a `-u` entry unless you pass `--include-untracked` (git 2.32+). A learner who checks the `-u` stash with `stash show` will not see `notes/draft.md`. Add after step 3: "`git stash show` does not list untracked files; add `--include-untracked` to see them."

## 8.06 When a stash conflicts

This is accurate. The real message is `CONFLICT (content)... The stash entry is kept in case you need it again.` (exit 1). These pass: `apply` instead of `pop` with a commit and an explicit `drop stash@{0}`; finishing with `git reset` instead of `add`; and `checkout --theirs` plus an edit. Dropping first fails, as it should.

**8.06-A (nit). The setup commit message does not match the change.** "Add an exclamation mark to the greeting" also changes `Hello` to `Hi`. Step 1 asks the learner to read this log. Fix: `commit "Shorten the greeting to Hi!"`. Marks are by name, so nothing else changes.

## 8.07 Stash into a new branch

**8.07-A (major). The goal accepts a branch made from `main`, which is the exact case the lesson exists to avoid.**
The "one commit above base" alternative (`refAt retry-limit~1 @mark:base`) also matches `newer`, because `newer~1 == base`.
Wrong approach that passes (tested `807-wrong`): `git switch -c retry-limit`, `git stash pop` (conflict), `git checkout --theirs app.py`, `git add app.py`, `git stash drop`.
Fix (tested): replace the `any` in goal 1 with
```json
{ "type": "all", "checks": [
    { "type": "isAncestor", "ancestor": "@mark:base", "descendant": "retry-limit" },
    { "type": "not", "check": { "type": "isAncestor", "ancestor": "@mark:newer", "descendant": "retry-limit" } }
  ] }
```
This also allows several commits on the branch. The reference solution, `stash branch retry-limit stash@{0}`, and the manual `switch -c retry-limit HEAD~1` plus `pop` all pass. The wrong approach now fails. The manual route does exactly what `stash branch` does; I think accepting it is right.

**8.07-B (nit).** Step 4 "Commit the change on this branch." The goals make this optional, as the author intends. Fix: "If you like, commit the change on this branch."

**8.07-C (nit).** "applying it always works". This holds only from a clean working tree, because `stash branch` has to check out the old commit first. Fix: "applying it works without conflicts, as long as your working tree is clean."

## 8.08 Work in two places at once

These pass: `worktree add -b hotfix ../hotfix`, `branch hotfix` plus `worktree add ../hotfix hotfix` with `git -C`, and the DWIM `git worktree add ../hotfix`, which creates branch `hotfix` from the folder name. Committing via `switch -c hotfix` in `work` fails, as it should.

**8.08-A (minor). The staging area is per worktree, but the text says otherwise.** "Only the checked-out files and the current branch are per worktree."
Fix: "Only the checked-out files, the staging area and HEAD (the current branch) are per worktree."

**8.08-B (minor). Wrong forward reference.** "Merging `hotfix` into `main` is a normal merge; the boss lesson of this section asks you to do exactly that." The boss starts from a fresh repo with no `hotfix`, and a merge is only one of its routes.
Fix: "Merging `hotfix` into `main` is a normal merge, like any other branch."

**8.08-C (nit).** Step 3: "Your edits are back in `work`." Fix: "Your edits stayed in `work`."

## 8.09 Manage worktrees

The refusal exits 128 and leaves no `again` folder. `scratch` shows as `prunable` in `worktree list`.

**8.09-A (minor). The quoted refusal text is out of date.** Git 2.42+ prints `fatal: 'main' is already used by worktree at '.../work'`. Older git says "is already checked out at". `content.md` says 'The "already checked out" refusal', and hint 1 says "main is already checked out in `work`".
Fix (content): 'The refusal ("already checked out" or, in newer git, "already used by worktree") is the same safety rule...'. Hint 1: "`git worktree add ../again main` is refused: main is already in use by the `work` worktree. Read the message."

**8.09-B (minor). Recall rule.** `requires: [worktree-add]`, but steps 1, 2 and 5 show `git worktree list` and `git worktree add ../again main`.
Fix: step 1 "List the worktrees. Three entries: ..."; step 2 "Try to add a worktree at `../again` with `main` checked out. Git refuses. Answer the question."; step 5 "List them one last time: only `work` remains." Hint 1 keeps the command.

**8.09-C (minor). `rm -rf ../review` plus `prune` passes the "remove the review worktree" goal** (tested `809-wrong-rmrf`). That repeats the mistake this lesson describes.
Fix (tested): add `{ "type": "usedCommand", "matches": "^git worktree remove\\b.*review" }` to goal 2's `all`. `worktree remove ../scratch` instead of `prune` still passes.

**8.09-D (nit).** "because two folders editing the same branch would overwrite each other's commits". In fact, a commit in one folder would move the branch under the other, leaving its files and staging area out of step. Fix: "because a commit made in one folder would move the branch under the other, leaving its files out of step." Optionally add "(`--force` overrides this)".

**8.09-E (nit).** `git worktree remove ../scratch` also works on a deleted folder (exit 0, tested), and the goals accept it. Optionally say so in "What just happened".

## 8.10 Boss: urgent hotfix

These pass: the stash route with `-u`, the stash route without `-u` (the untracked file does not get in the way), the worktree route with `merge --ff-only`, and the worktree route with `cherry-pick`. Committing everything fails, as it should.

**8.10-A (major). The boss can be passed without stash or worktree.** Edit `lib.py`, `git add lib.py`, commit (tested `810-bypass-no-stash`: ok). This is the simplest route, and it uses nothing from section 8.
Fix (tested): add as the first goal
```json
{ "label": "Get the feature work out of the way with a stash or a second worktree", "sticky": true, "check": { "type": "any", "checks": [
    { "type": "all", "checks": [
        { "type": "stash", "count": 1 },
        { "type": "fileContent", "path": "app.py", "source": "stash@{0}", "contains": "def export_csv" }
      ] },
    { "type": "worktreeCount", "equals": 2 }
  ] } }
```
Both real routes pass; the bypass fails.

**8.10-B (minor). A `--no-ff` merge of the hotfix is rejected.** `commitChanges` runs `diff-tree` on the merge commit, which lists no paths (tested `810-alt-worktree-noff`: FAIL). Section 6 teaches `--no-ff`.
Fix (tested): goal "That commit touches only lib.py" becomes
```json
{ "type": "any", "checks": [
    { "type": "commitChanges", "rev": "main", "paths": ["lib.py"], "exact": true },
    { "type": "all", "checks": [
        { "type": "commitParents", "rev": "main", "count": 2 },
        { "type": "refAt", "ref": "main^1", "target": "@mark:base" },
        { "type": "commitChanges", "rev": "main^2", "paths": ["lib.py"], "exact": true },
        { "type": "refAt", "ref": "main^2~1", "target": "@mark:base" }
      ] }
  ] }
```

**8.10-C (minor).** `requires: [section]`. The writer brief says "list the real skill ids", the same issue as X3 in `section-3-4.md`; follow the lead's ruling there. If it is applied: `requires: [stash-push, stash-inspect, stash-pop-apply, stash-message-path, stash-untracked, stash-conflict, stash-branch, worktree-add, worktree-manage, add, commit, merge-ff]`. Use the real skill ids for add, commit and merge-ff from sections 2 and 6.

**8.10-D (nit).** "which is the circumference formula with the wrong constant". `3.14 * r` is half a circumference, so the remark confuses more than it helps. Fix: "`area` in `lib.py` returns `3.14 * r`; it must be `3.14 * r * r`."

**8.10-E (nit).** `repos:` lists only `work`. On the worktree route, the learner's second folder is not selectable in the graph. Its name is the learner's choice, so this is acceptable; the worktree HEAD markers still show.

---

## Alternative-approach tests run

All runs use `./target/debug/canopy-lesson test <id> --solution /tmp/claude-1000/review8/<file>.yaml`. The "after fix" column runs the same file with `--lessons /tmp/claude-1000/review8/lessons`.

| File | What it does | Live | After fix | Expected? |
|---|---|---|---|---|
| 801-alt | `checkout`, `stash push -m` | ok | | yes |
| 801-wrong | `restore .` instead of stash | FAIL stash goal | | yes |
| 802-alt-hash | `show --patch`, hash prefix `f668702` | ok | | yes |
| 802-alt-ref | `show stash@{1} -p`, answer `stash@{1}`, `"dark"` | ok | | yes (but see 8.02-A) |
| 802-wrong-prompt-example | answers `stash@{2}` from the prompt | FAIL answer | | yes |
| 802-variant-theme | theme `theme="dark"` | FAIL answer | | no, 8.02-B |
| 802-new-wrong-content-example | answers `stash@{1}` (content example) | (ok) | FAIL | yes, after 8.02-A |
| 802-new-alt | answer `stash@{2}`, `theme="dark"` | | ok | yes |
| 803-alt | pop then apply | ok | | yes |
| 803-alt2 | apply both, `drop stash@{0}` | ok | | yes |
| 803-wrong | `pop stash@{1}` then apply | FAIL list goal | | yes |
| 804-alt1 | `push app.py -m ...` | ok | ok | yes |
| 804-alt2 | `git stash -m ... -- app.py` | ok | ok | yes |
| 804-alt3 | `--message=... app.py` | ok | ok | yes |
| 804-wrong | stash both, restore README from stash | ok | FAIL | no, 8.04-A |
| 805-alt1 | `--include-untracked -m`, `stash --keep-index` | ok | ok | yes |
| 805-alt2 | `push -u --keep-index -m` | ok | ok | yes |
| 805-alt-k | `git stash -k` | FAIL | ok | no, 8.05-A |
| 805-all | `--all` for the untracked step | ok | ok | yes |
| 805-wrong-mv | move draft away, plain stash | ok | FAIL | no, 8.05-B |
| 805-wrong-path | `stash push -- app.py` instead of `--keep-index` | FAIL | FAIL | yes |
| 806-alt-apply | `apply`, resolve, commit, `drop stash@{0}` | ok | | yes |
| 806-alt-reset | resolve, `git reset` instead of add | ok | | yes |
| 806-alt-mergetool-theirs | `checkout --theirs`, edit, add | ok | | yes |
| 806-wrong | drop first, then write the file | FAIL sticky | | yes |
| 807-alt-named | `stash branch retry-limit stash@{0}` | ok | ok | yes |
| 807-alt-manual | `switch -c retry-limit HEAD~1`, pop | ok | ok | yes (same as stash branch) |
| 807-wrong | branch from main, pop, take theirs, drop | ok | FAIL | no, 8.07-A |
| 808-alt1 | `worktree add -b hotfix ../hotfix` | ok | | yes |
| 808-alt2 | `branch` + `worktree add ../hotfix hotfix`, `git -C` | ok | | yes |
| 808-alt-dwim | `worktree add ../hotfix` (branch from folder name) | ok | | yes |
| 808-wrong | `switch -c hotfix` in work | FAIL | | yes |
| 809-alt-remove-stale | `worktree remove ../scratch` instead of prune | ok | ok | yes |
| 809-wrong-rmrf | `rm -rf ../review` + prune | ok | FAIL | no, 8.09-C |
| 809-wrong-switch | `git switch review` instead of the add | FAIL | | yes |
| 810-alt-worktree | worktree, `merge --ff-only`, remove | ok | ok | yes |
| 810-alt-worktree-cherry | worktree, `cherry-pick hotfix` | ok | ok | yes |
| 810-alt-worktree-noff | worktree, `merge --no-ff` | FAIL | ok | no, 8.10-B |
| 810-alt-stash-no-u | plain `git stash` | ok | ok | yes |
| 810-bypass-no-stash | `add lib.py`, commit, no stash/worktree | ok | FAIL | no, 8.10-A |
| 810-wrong-all | `add -A`, commit | FAIL | FAIL | yes |
