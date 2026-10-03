# Review: sections 3 and 4 (lessons 3.01 to 4.13)

Reviewer: independent senior review, 2026-10-03. No lesson files were edited. Every proposed goal, question and fixture change marked "tested" was applied to a scratch copy of `lessons/` (`/tmp/claude-1000/review34/lessons`). The copy was run through `canopy-lesson validate` (47 lessons, 0 errors) and `canopy-lesson test 3 4` (26 tested, 0 failed). The alternative and wrong solutions listed at the end were also run against it. Git used: 2.43.0.

## Overall verdict

The two sections are solid. The fixtures are deterministic and realistic, the text is short and mostly accurate, and every reference solution passes (`validate`: no errors in sections 3–4, and the only 4 errors belong to 6.01/6.02; `test 3 4`: 26 tested, 0 failed). I re-derived every question answer with real git on the built fixtures. All of them are correct.

The main problems:

- **`commit` questions can be answered by typing the name the question gives.** The checker resolves any revision (`crates/canopy-core/src/check.rs` lines 98–111), so `dark-mode`, `HEAD~2`, `HEAD~3^2`, `v1.0`, `main` and `fix-units` are accepted as answers. Six questions in these sections can be answered without reading anything. Tested. (major, in 3.02, 3.06, 3.07, 3.08, 3.13, 4.06)
- **Text that is wrong about git:** 4.01 says `git restore <file>` copies from HEAD (it copies from the staging area). 3.08 gives `main^2` as a working example (it fails). 4.08 says a mixed reset "empties the staging area". (major)
- **Questions that do not test the idea:** the 3.10 whitespace question can be answered without `-w`, and the 3.13 "HEAD~4" answer (`Lisbon`) is also the answer for HEAD~3, ~5, ~6, ~7 and for a naive count down the log. (major)
- **4.10 rejects `git reset HEAD notes-private.md`**, the classic unstage form. (major)
- **Two author assumptions in `lessons/_notes/section-3-4.md` are wrong**, and both cost the lessons a goal:
  1. "every solution command must exit 0" is false. A `usedCommand` with `"exitCode": 128` passes when the solution runs a failing command. 3.06's "git refuses a too-short prefix" goal works (tested).
  2. "Ordering of commands cannot be checked" is also false. The harness re-checks goals after every command, and sticky goals latch (`harness.rs` around line 140). A sticky `all` of the `usedCommand` plus a state that only holds *before* the destructive step enforces "dry run first" (4.11), "read the diff first" (4.01) and "read the status first" (4.09). All three tested: right order passes, wrong order fails.

Counts: **0 blocker, 15 major, 33 minor, 14 nit.** X1 and X2 are counted once per affected lesson. 3.13-C and 4.13-C are instances of X3 and are not counted twice.

Process note for the lead: another author is writing lessons right now. `lessons/14.09/` exists without a `lesson.yaml`, so `canopy-lesson test` and `validate` on the live tree currently stop with "reading .../14.09/lesson.yaml: No such file". I ran everything against a copy of sections 1–4.

---

## Cross-cutting

**X1 (major, counted per lesson below). `commit` questions accept any revision, including the expression in the prompt.**
Code: `QuestionKind::Commit` calls `ctx.resolve(&git, given)`, which is `rev-parse --verify <given>^{commit}`.
Tested giveaways, all accepted as correct: 3.02 `dark-mode`, 3.06 `v1.0`, 3.08 `HEAD~2` and `HEAD~3^2`, 3.13 `fix-units`, 4.06 `main`. 3.07 accepts `HEAD`/`main` before the commit (by inspection; same code path).
Why: the learner copies a label or the prompt's own expression and never opens the graph or runs anything.
Fix (lesson-level, used below): where the prompt or a visible label names the commit, switch to a `choice` question over commit subjects, or to a `text` question for the 4-character prefix.
Fix (app-level, recommended for the lead): give `commit` questions an option such as `"hexOnly": true`, or make that the default, so only hash prefixes are accepted. Then most of the per-lesson changes become unnecessary. Also note that `:/text` answers never work, because `^{commit}` is appended to the search text. That is harmless.

**X2 (major for 4.11, minor for 4.01 and 4.09). "Do X before Y" can be enforced with a sticky goal.**
Pattern: `{"sticky": true, "check": {"type": "all", "checks": [ <usedCommand X>, <a state that is true only before Y> ]}}`. The harness evaluates it after each command, so it can only latch while the "before" state still holds. JSON for each lesson is below; all tested.
Also update `lessons/_notes/section-3-4.md`: delete the "Ordering of commands cannot be checked" bullet and rewrite the 3.06 bullet (see 3.06-A).

**X3 (minor). Boss lessons use `requires: [section]`. The brief says "list the real skill ids in `requires`", and 1.07 and 2.14 do that.**
Files: `3.13/lesson.yaml`, `4.13/lesson.yaml`.
Fix:
- 3.13: `requires: [log-oneline, log-graph, log-filter, log-path, show, concept-commit-id, head, relative-refs, diff-commits, diff-options, blame, describe]`
- 4.13: `requires: [status, add, commit, restore, restore-staged, restore-source, revert, revert-options, concept-reset, reset-soft, reset-mixed, reset-hard, reset-path, clean, undo-decision]`

**X4 (nit). `requires` misses `add`/`commit` in 3.07, 4.03, 4.05, 4.07, 4.08, 4.12, 4.13.** The author recorded this. The text describes those steps by intent, so the recall rule holds. Add them if `requires` is ever used for more than ordering.

---

## Section 3

### 3.01 Compact history

**3.01-A (minor). The `-n 3` goal rejects `--max-count=3`.**
File: `3.01/goal.json`, goal "Limit the log to the three newest commits", `"matches": "^git log\\b.*(-n ?3|-3)\\b"`.
Tested: `git log --oneline --max-count=3` fails. `-30` correctly fails.
Fix (tested): `"matches": "^git log\\b.*(-n ?3|-3|--max-count[= ]3)\\b"`

**3.01-B (minor). Hint 1 leads to a wrong count.**
File: `3.01/lesson.yaml` hint 1: "Count the lines, or look at the graph."
Why: the app's graph shows every branch (3.02 relies on that), which is 16 commits including `dark-mode`. The question's answer is 15. A learner who counts the graph gets it wrong (tested: 16 is rejected).
Fix: "`git log --oneline` prints one commit per line. Count its lines (the graph also shows a second branch, so it has one commit more)."

### 3.02 See the shape of history

**3.02-A (major, X1). Typing `dark-mode` answers "Which commit is the tip of the branch `dark-mode`?"**
File: `3.02/goal.json`, question `dark-mode-tip`. Tested: answer `dark-mode` is accepted.
Fix (tested): replace the question with
```json
{ "id": "dark-mode-tip", "prompt": "Which commit is the tip of the branch `dark-mode`?", "type": "choice",
  "options": ["Add dark theme variables", "Add gluten-free note to menu", "Add newsletter signup to index", "Add spiced latte"], "answer": 0 }
```
and in `solution.yaml` use `dark-mode-tip: 0`.
(`merge-commit` also accepts `v1.0`. That is acceptable: it needs reading the tag next to the merge.)

**3.02-B (nit). `--decorate` is presented as needed.** Since git 2.13, labels show by default in a terminal (`log.decorate=auto`).
File: `3.02/content.md`: "- `--decorate` prints labels: branch names, tags and `HEAD`."
Fix: "- `--decorate` prints labels: branch names, tags and `HEAD` (a terminal shows them anyway; the option makes sure)."

### 3.03 Filter history by who, when and what

No significant findings. Answers verified: Sam 5 (also 5 with `--all`), March 11–17 gives 3, typo commit `125ef90`. Tested `--author="Sam Chen"`, `--after/--before`, the space-separated forms and `--grep typo`. All pass.

**3.03-A (nit). The date margin is thin for UTC-11/-12 learners.** `seasonal-1` is at 2024-03-18 10:00 UTC, which is 23:00 on March 17 in UTC-11. A late-evening learner there would count 4. Optional fix in `bakery.sh`: `at 2024-03-18T12:00` for `seasonal-1` (it stays before `reformat`'s 14:00, so the answers do not change).

### 3.04 History of one file

**3.04-A (minor). The "Log the history of pages/menu.md" goal rejects running from inside `pages/`.**
File: `3.04/goal.json`, `"matches": "^git log\\b.*pages/menu\\.md"`.
Tested: `cd pages; git log --oneline -- menu.md` fails this goal (the `--follow` goal already accepts `menu\.md`).
Fix (tested): `"matches": "^git log\\b.*menu\\.md"`

Answers verified: 5 without `--follow` and 7 with it (history simplification correctly skips the merge); the rename commit is `c5f79fd`.

### 3.05 Inspect one commit

**3.05-A (minor). The "Print menu.md as it was at v0.1" goal only accepts the tag name.**
File: `3.05/goal.json`, `"matches": "^git show\\b.*v0\\.1:menu\\.md"`.
Tested: `git show 35f7316:menu.md` (the same commit by id, which the text says works) fails.
Fix (tested): `"matches": "^git show\\b.*(v0\\.1|35f7[0-9a-f]*)(\\^\\{\\})?:(\\./)?menu\\.md"`

**3.05-B (nit).** Goal "Show a commit" (`^git show\b`) is implied by the other two goals. Drop it, or keep it as a first milestone.

### 3.06 Commit ids

**3.06-A (major). The "git refuses a too-short prefix" goal was dropped on a wrong assumption.**
Files: `3.06/goal.json`, `3.06/solution.yaml` (commented `# git show 3ad`), `_notes/section-3-4.md`.
Why: the curriculum asks that "command history shows short ids used correctly", and step 3 asks for the refusal. The harness does not require exit 0.
Fix (tested): add after the first goal
```json
{ "label": "See git refuse a prefix that is too short",
  "check": { "type": "usedCommand", "matches": "^git show( \\S+)* [0-9a-f]{1,3}( |$)", "exitCode": 128 } }
```
In `solution.yaml`, replace the two comment lines with the plain line `git show 3ad`. Tested: `git show 3ad` exits 128 and passes. Leaving it out fails, and so does `git show xyz` (not hex).

**3.06-B (major, X1). "Answer with only the first 4 characters" accepts `v1.0`.**
File: `3.06/goal.json`, question `v1-commit`. Tested: `v1.0` is accepted.
Fix:
```json
{ "id": "v1-commit", "prompt": "Which commit does tag v1.0 point to? Answer with only the first 4 characters of its id.",
  "type": "text", "accept": ["3ad9"] }
```
The answer stays deterministic: it is a setup commit, and I verified that no 4-character prefix collides among the repo's 55 objects.

**3.06-C (minor). The description of the refusal is wrong.**
File: `3.06/content.md`: "If a prefix is too short, or matches more than one commit, git refuses with "ambiguous argument" and asks for more characters."
Why: real output for 3 characters is `fatal: ambiguous argument '3ad': unknown revision or path not in the working tree.` Git does not treat it as an id at all and does not ask for more characters. A longer ambiguous prefix gives `error: short object ID ... is ambiguous` with a list of candidates.
Fix: "A prefix shorter than 4 characters is not treated as an id at all: git stops with "ambiguous argument ... unknown revision". If a longer prefix matches more than one object, git says the short id "is ambiguous" and lists the candidates."

**3.06-D (minor). "Only one commit" should be "only one object".**
File: `3.06/content.md`: "as long as it is at least 4 characters long and only one commit in the repo starts with it."
Why: `git show` considers every object (file and folder snapshots too). A prefix shared by a commit and a blob is refused.
Fix: "as long as it is at least 4 characters long and nothing else stored in the repo starts with it."

**3.06-E (minor). The 7-character explanation is off.**
File: `3.06/content.md`: "The compact log prints 7 characters because that is enough for most projects." and "That is why 4 characters work in a small repo but larger projects need 8 or more."
Why: git chooses the printed length automatically, at least 7 and more as the repo grows (the Linux kernel prints 12). The curriculum's "find the shortest unambiguous prefix" is also not covered.
Fix: "Git picks the printed length for you: 7 characters in most projects, more in very large ones." In "What just happened": "That is why 4 characters work in a small repo, while git prints longer ids in very large projects. `git log --oneline --abbrev=4` prints every id at the shortest length that is still unique." (In this repo that is 4 for every commit; verified.)

**3.06-F (nit).** Hint 2 and the question say "the commit tag v1.0 points to". v1.0 is annotated, so it points to a tag object that points to the commit. That is fine at this level, but 3.12 states "annotated" explicitly, so consider "the commit tagged v1.0".

### 3.07 What is HEAD

**3.07-A (major, X1). `head-before` accepts `HEAD` or `main`.**
File: `3.07/goal.json`, question `head-before`. (`HEAD` resolves to the right commit while the learner has not committed yet.)
Fix:
```json
{ "id": "head-before", "prompt": "Before you make any commit: which commit does HEAD point to?", "type": "choice",
  "options": ["Add newsletter signup to index", "Add dark theme variables", "Merge branch 'seasonal-menu'", "Add README and site skeleton"], "answer": 0 }
```
In `solution.yaml`, use `head-before: 0`.

**3.07-B (minor). Plain `git show` does not count as looking at HEAD.**
File: `3.07/goal.json`, `"matches": "^git (show\\b.*HEAD|log\\b.*(-1|-n ?1)\\b)"`. Tested: `git show` (which shows HEAD) fails.
Fix (tested): `"matches": "^git (show(\\s*$|\\b.*\\b(HEAD|@))|log\\b.*(-1|-n ?1)\\b)"`

**3.07-C (minor). "`git log -1` prints only the newest commit" is inaccurate.** It prints the commit HEAD points to, which is not necessarily the newest by date. Here `dark-mode` is a day older, so the claim happens to hold.
Fix: "- `git log -1` prints only the first commit of the log, which starts at HEAD: the same commit."

**3.07-D (nit).** Step 4 says "draw the graph again", but the graph was not drawn in this lesson. Use "draw the graph". The commit goals are robust: `--amend` fails, `commit -am` passes, a commit without README fails (tested).

### 3.08 Relative references

**3.08-A (major). The example `main^2` fails.**
File: `3.08/content.md`: "These work after any commit name, not only HEAD: `v1.0~1`, `main^2`."
Why: `main` is not a merge. `git show main^2` gives `fatal: ambiguous argument 'main^2'` (tested). A learner who tries the example gets an error in the lesson that teaches `^2`.
Fix: "These work after any commit name, not only HEAD: `main~1`, `v1.0^2` (v1.0 is the merge)."

**3.08-B (major, X1). Both commit questions accept their own prompt text.**
File: `3.08/goal.json`, questions `head-2` ("Which commit is HEAD~2?") and `head-3-2`. Tested: answers `HEAD~2` and `HEAD~3^2` are accepted.
Fix:
```json
{ "id": "head-2", "prompt": "Which commit is HEAD~2?", "type": "choice",
  "options": ["Raise prices for spring", "Add gluten-free note to menu", "Merge branch 'seasonal-menu'", "Add newsletter signup to index"], "answer": 0 },
{ "id": "head-3-2", "prompt": "Which commit is HEAD~3^2?", "type": "choice",
  "options": ["Add spiced latte", "Reformat stylesheet", "Add pumpkin loaf for autumn", "Raise prices for spring"], "answer": 0 }
```
In `solution.yaml`, use `head-2: 0` and `head-3-2: 0`. The wrong options are the classic off-by-one, first-parent and wrong-side mistakes.

**3.08-C (minor). The `~` goal rejects `@~2`, `main~2` and `v1.0~1`, which the text itself offers.**
File: `3.08/goal.json`, `"matches": "^git (show|log)\\b.*HEAD~"`. Tested: `git show @~2` fails.
Fix (tested): `"matches": "^git (show|log)\\b.*\\S~\\d*"`

### 3.09 Compare two commits

**3.09-A (minor). "Compare two commits" passes with a working-tree diff.**
File: `3.09/goal.json`, `"matches": "^git diff\\b.*(\\S+ \\S+|\\.\\.)"`. Tested: `git diff --stat HEAD` passes it, because `--stat HEAD` counts as two tokens.
Fix (tested): `"matches": "^git diff( -\\S+)* [^-\\s]\\S*?( |\\.\\.)[^-\\s]\\S*"`. It accepts `A B`, `A..B` and `A B -- path`, and rejects `--stat HEAD`.

Answers verified: HEAD~2..HEAD touches index.html and pages/menu.md, and the baguette goes from 4.00 to 40.0.

### 3.10 Diff options

**3.10-A (major). The whitespace question does not need `-w`.**
File: `3.10/goal.json` question `whitespace-file`; `content.md` step 2; hint 2.
Why: `git diff HEAD~5 HEAD~4` changes exactly one file (styles.css), so the plain diff answers "which file changed only in whitespace" by elimination. With `-w` the output is empty (verified). The option is used but never needed.
Fix (tested): compare HEAD~5 with HEAD~3 (contact to the merge). Without `-w` it shows styles.css and pages/menu.md; with `-w` only pages/menu.md is left.
```json
{ "id": "whitespace-file", "prompt": "Two files changed between HEAD~5 and HEAD~3. Which one changed only in whitespace?",
  "type": "choice", "options": ["styles.css", "pages/menu.md", "Both", "Neither"], "answer": 0 }
```
Step 2: "Run `git diff HEAD~5 HEAD~3`, then the same with `-w`. One of the two files disappears: it changed only in spacing."
Hint 2: "Run the HEAD~5 to HEAD~3 comparison twice, once with `-w`. The file that disappears changed only in whitespace."
In `solution.yaml`, use `git diff HEAD~5 HEAD~3` and `git diff -w HEAD~5 HEAD~3`.
Also add a sentence (verified behaviour): "`-w` changes the patch and `--stat`, but `--name-only` still lists the file."

**3.10-B (minor). Git prints `R100`, not `R`.**
File: `3.10/content.md`: "`--name-status`: file names with a letter: `A` added, `M` modified, `D` deleted, `R` renamed." Real output: `R100	menu.md	pages/menu.md`.
Fix: append "(a rename shows as `R` plus how similar the two versions are, e.g. `R100`)". Keep the question option "R, renamed".

**3.10-C (nit).** The `-w` and `--name-*` goals pass with no commits named (`git diff -w`, `git diff --name-only`; tested). The answers still force the right comparison, so this is acceptable.

### 3.11 Who changed this line

**3.11-A (minor). "Open the commit blame points to" passes with any `git show`.**
File: `3.11/goal.json`, `"matches": "^git show\\b"`. Tested: `git show HEAD` passes it.
Fix (tested): `"matches": "^git (show|log)\\b.*\\b(8357[0-9a-f]*|HEAD~2)(\\s|$)"`. Blame prints the 8-character `8357bc78`, and the 7-character id from the log also matches.

**3.11-B (minor). `-L` with a regex range is rejected.**
File: `3.11/goal.json`, `"matches": "^git blame\\b.*-L ?\\d"`. Tested: `git blame -L /Baguette/,+1 pages/menu.md` fails.
Fix (tested): `"matches": "^git blame\\b.*-L ?\\S"`

**3.11-C (nit). Blame output has a filename column here** (`menu.md` vs `pages/menu.md`) because it follows the rename. The text does not mention it.
Fix: in content.md, after "the author and the date" add: "(when the file was renamed, also the name it had in that commit)".

### 3.12 Name a commit by its nearest tag

**3.12-A (minor). Reasonable forms are rejected.**
File: `3.12/goal.json`. Tested: `git describe --tags` fails "Describe HEAD", and `git describe HEAD~3` (the tagged commit) fails "Describe the tagged commit itself".
Fix (tested):
- "Describe HEAD": `"matches": "^git describe( --tags)?( (HEAD|@|main))?\\s*$"`
- "Describe the tagged commit itself": `"matches": "^git describe\\b.*(v1\\.0|HEAD~3|3ad9[0-9a-f]*)"`

**3.12-B (nit).** "The count and the short id make the name unique, so two different builds never describe the same." The short id is what makes it unique. Fix: "The short id makes the name unique: two different commits never get the same description."

Answers verified: `v1.0-3-g9536875`, `v1.0-2-gdd4c083`, `v1.0`.

### 3.13 Boss: investigate a mystery repo

**3.13-A (major). The HEAD~4 question does not test HEAD~4.**
File: `3.13/goal.json`, question `city-head4` (accept "Lisbon").
Why: DEFAULT_CITY is "Lisbon" at HEAD~3, ~4, ~5, ~6 and ~7. It is also "Lisbon" in `437eff2`, the 5th line of plain `git log --oneline`, which is where a learner lands who counts lines instead of first parents (verified). Off-by-one and naive counting both get it right.
Fix (tested): replace it with a question about the snapshot that separates HEAD~4 (`1128da3`) from HEAD~3, HEAD~5 and the 5th log line:
```json
{ "id": "city-head4", "prompt": "What did weather.py look like at HEAD~4?", "type": "choice", "options": [
  "KELVIN_OFFSET = 273.51, and there is no to_fahrenheit function yet",
  "KELVIN_OFFSET = 273.51, and to_fahrenheit is already there",
  "KELVIN_OFFSET = 273.15, and to_fahrenheit is already there",
  "KELVIN_OFFSET = 273.15, and there is no to_fahrenheit function yet"], "answer": 0 }
```
Goal label: "What weather.py looked like at HEAD~4". In `solution.yaml`, use `city-head4: 0`. Tested: option 2 (the naive 5th-line answer) fails.

**3.13-B (major, X1). `merged-tip` accepts `fix-units`.**
File: `3.13/goal.json` question `merged-tip`; `_lib/fixtures/weather.sh`. Tested: answer `fix-units` is accepted.
Fix (tested): delete the merged branch in the fixture, as teams usually do. In `weather.sh`, right after `mark merge`, add `git branch -d -q fix-units`, and remove `<- branch fix-units` from the header comment. The graph still shows the side line, `v1.1^2`/`HEAD~3^2` still work, and `fix-units` no longer resolves (tested: it is rejected; all 3.13 goals pass with the reference solution).

**3.13-C (minor).** `requires: [section]`, see X3.

Other answers verified: blame line 2 gives `1128da3` by Jordan; v1.0..v1.1 is `A CHANGELOG.md`, `M README.md`, `R100 config.ini settings.ini`, `M weather.py`; Priya has 4 commits. The "added" options include `settings.ini`, which shows as A only if rename detection is off. That is fine at git ≥ 2.9 (`diff.renames=true`).

---

## Section 4

### 4.01 Discard changes in a file

**4.01-A (major). The text says restore copies from HEAD. It copies from the staging area.**
File: `4.01/content.md`: "copies the file from HEAD over the file on disk."
Why: without `--source`, `git restore <file>` restores the working tree from the index. If the file has staged changes, the learner gets the staged version back, not HEAD's. This matters in 4.12 and 4.13, where files are staged. It also contradicts 2.x, which teaches that plain `git diff` compares the working tree with the staging area.
Fix: "puts the file on disk back to the version in the staging area. When nothing is staged for that file, as here, that is the version from the last commit." In "What just happened": "`notes.txt` in the working tree now matches the staging area and HEAD again."

**4.01-B (minor, X2). "Read the diff before discarding anything" does not check "before".**
Tested: `git restore notes.txt` then `git diff` passes.
Fix (tested):
```json
{ "label": "Read the diff before discarding anything", "sticky": true, "check": { "type": "all", "checks": [
  { "type": "usedCommand", "matches": "^git diff\\b" },
  { "type": "fileContent", "path": "notes.txt", "source": "worktree", "contains": "pasted by mistake" } ] } }
```

**4.01-C (minor). The restore goal rejects `--worktree`/`-W`.**
File: `4.01/goal.json`, `"matches": "^git restore( --)? notes\\.txt"`. Tested: `git restore --worktree notes.txt` and `git restore -W notes.txt` fail.
Fix (tested): `"matches": "^git restore( (--worktree|-W|--))* (\\./)?notes\\.txt\\s*$"`. `git restore notes.txt todo.txt` still fails through the todo goal (tested).

### 4.02 Unstage a file

**4.02-A (minor). `-S` is rejected.**
File: `4.02/goal.json`, `"matches": "^git restore\\b.*--staged.*draft\\.md"`. Tested: `git restore -S draft.md` fails.
Fix (tested): `"matches": "^git restore\\b.*(--staged|\\s-S\\b).*draft\\.md"`

**4.02-B (minor). "Nothing is lost either way here." is confusing.**
File: `4.02/content.md`: "Without `--staged`, `restore` changes the file on disk instead (the previous lesson). With it, only the staging area changes. Nothing is lost either way here."
Why: the previous lesson just said restore without `--staged` destroys edits. The sentence is only true because the worktree equals the index here.
Fix: "Without `--staged`, `restore` changes the file on disk instead (the previous lesson). With `--staged`, only the staging area changes, so your edits on disk are safe."

### 4.03 Bring back an old version of a file

**4.03-A (minor). `-s` is rejected.**
File: `4.03/goal.json`, `"matches": "^git restore\\b.*--source[= ].*settings\\.conf"`. Tested: `git restore -s HEAD~1 settings.conf` fails.
Fix (tested): `"matches": "^git restore\\b.*(--source[= ]|\\s-s ?\\S).*settings\\.conf"`

**4.03-B (minor). The story suggests the timeout change was intended, but the goal undoes it.**
File: `4.03/content.md`: "The last commit changed `settings.conf` and broke it: the timeout was shortened, but the `retries` line went missing too."
Why: "but ... too" reads as "the timeout change was the point, the missing line was the accident". A careful learner would then want to keep `timeout = 5`, but the goal requires `timeout = 30`.
Fix: "The last commit broke `settings.conf`: it cut the timeout to a value that is far too low, and it deleted the `retries` line. The version before that commit was right."

Robustness is good: `revert` passes the state but fails the restore goal (intended); `--source=HEAD~2` fails; reset fails (all tested).

### 4.04 Revert a commit

**4.04-A (minor). The revert check uses the message, so a manual undo passes and `revert -n` fails.**
File: `4.04/goal.json`, check `{ "type": "commitMessage", "rev": "HEAD", "matches": "(?i)revert" }`.
Tested: deleting tracker.js by hand and committing as "Revert tracking" passes. `git revert -n HEAD~1` followed by a commit "Remove tracking script" fails.
Fix (tested): replace that check with `{ "type": "usedCommand", "matches": "^git revert\\b" }`.

**4.04-B (nit).** "An editor opens with the prepared message; keep it and save." Add "and close it", matching how 2.05 describes the editor flow.

Other approaches pass (`--no-edit @~1`); `revert HEAD` and `reset --hard HEAD~2` fail (tested).

### 4.05 Revert in more detail

**4.05-A (minor). Step 3's status will tell the learner a revert is in progress and suggest `git revert --continue`.**
Verified: after `git revert --no-commit HEAD~2..HEAD`, `git status` prints "You are currently reverting commit 18d4925 ... run "git revert --continue"". `--continue` commits with the prepared message `Revert "Add banner ad"`, which is misleading for a two-commit undo and fails the message goal unless edited in the editor.
Fix, step 3: "Check the status: the removals are staged, nothing is committed yet. Git says a revert is in progress; making a normal commit finishes it."

**4.05-B (minor). `--no-commit` is described as staging-only.**
File: `4.05/content.md`: "undoes the commit in the staging area but does not commit". It also changes the working tree.
Fix: "undoes the commit in your files and the staging area, but does not commit."

**4.05-C (minor). `--no-edit` is taught but never used.** The curriculum lists it. Either add a step ("Revert a single commit with `--no-edit` first" needs another commit in setup), or keep it as a mention and accept the gap. I suggest keeping it and adding to the notes that it is a mention only.

Robustness is good: `-n HEAD HEAD~1`, `--no-commit @~2..` and lowercase messages pass; two separate reverts and reset fail (tested).

### 4.06 What reset really does

**4.06-A (major, X1). `main-now` accepts `main`.**
File: `4.06/goal.json`, question `main-now`. Tested: answer `main` is accepted.
Fix:
```json
{ "id": "main-now", "prompt": "After the reset, which commit does main point to?", "type": "choice",
  "options": ["Add tomato soup", "Add salt to soup", "Add pancakes", "Add README"], "answer": 0 }
```
In `solution.yaml`, use `main-now: 0`.

**4.06-B (minor). "clears the staging area" (see 4.08-A).**
File: `4.06/content.md`: "With no option, reset moves the branch and clears the staging area, but..."
Fix: "With no option, reset moves the branch and resets the staging area to match the new commit (so nothing is staged), but..."

`--soft` and `--hard` fail; `HEAD^` and `--mixed` pass (tested).

### 4.07 Reset softly

No findings. Tested: `@~2`, and soft-reset-one-then-`--amend`, pass. `HEAD~3`, `--hard`, and an extra `git reset` before committing (so the stylesheet is not staged) fail.

### 4.08 Reset mixed

**4.08-A (major). "Empties the staging area" is wrong, and the question's correct option repeats it.**
Files: `4.08/content.md` ("it also **empties the staging area**", "mixed reset clears it"), `4.08/lesson.yaml` hint 1 ("empties the staging area"), `4.08/goal.json` option 0 ("the staging area is empty").
Why: a mixed reset makes the staging area *match the target commit*. It still holds README.md and parser.py. Section 2 teaches the staging area as "the version you have marked for the next commit". "Empty" would mean the next commit deletes everything.
Fix:
- content: "Like `--soft` it moves the branch, but it also **resets the staging area to match that commit**, so nothing is staged any more: the changes from the undone commit are back in your working tree as unstaged changes."
- "What just happened": "Soft reset keeps what is staged; mixed reset unstages it."
- hint 1: "Plain `git reset HEAD~1` moves main back one commit and unstages everything. Both files are still on disk."
- option 0: "In the working tree only; nothing is staged"

**4.08-B (minor). The reset goal rejects `@~`, `-q` and `main~1`.**
File: `4.08/goal.json`, `"matches": "^git reset( --mixed)? (HEAD~1?|HEAD\\^|[0-9a-f]{4,40})\\s*$"`. Tested: `git reset @~` and `git reset -q HEAD~1` fail.
Fix (tested): `"matches": "^git reset( (--mixed|-q|--quiet))* (HEAD|@|main|[0-9a-f]{4,40})([~^][0-9]*)*( --mixed)?\\s*$"`. `--soft` and `--hard` still fail it.

**4.08-C (minor). "`debug.log` is now an untracked file that never made it into history" is not quite true.** It was committed, and that commit still exists, unreachable.
Fix: "`debug.log` is now an untracked file and is no longer in the history of `main`, which is what you wanted."

### 4.09 Reset hard

**4.09-A (minor). "Anything not in that commit is gone" overstates.** Untracked files survive `reset --hard`. This matters in 4.12 case 3 and 4.13.
File: `4.09/content.md`.
Fix: append "Untracked files are not touched; lesson 4.11 deals with those."

**4.09-B (minor, X2). "Read the status before resetting" does not check "before".** Tested: reset then status passes.
Fix (tested):
```json
{ "label": "Read the status before resetting", "sticky": true, "check": { "type": "all", "checks": [
  { "type": "usedCommand", "matches": "^git status\\b" },
  { "type": "refAt", "ref": "HEAD", "target": "@mark:exp2" } ] } }
```

**4.09-C (nit).** "Mixed also clears the staging area." Change to "Mixed also resets the staging area." (see 4.08-A).

Destructive overreach is caught: `HEAD~3` fails; `HEAD~1` fails; mixed reset plus `restore .` fails (`experiment.txt` stays untracked); `@~2` and the sha pass (tested).

### 4.10 Reset one file

**4.10-A (major). `git reset HEAD notes-private.md` is rejected.**
File: `4.10/goal.json`, `"matches": "^git reset( --)? notes-private\\.md\\s*$"`.
Why: `git reset HEAD <file>` is the form git itself suggested for years and the one most learners have seen. Tested: `git reset HEAD notes-private.md`, `git reset HEAD -- notes-private.md` and `git reset -q notes-private.md` all leave this goal unchecked while the state goals pass.
Fix (tested): `"matches": "^git reset( (-q|--quiet))*( (HEAD|@))?( --)? (\\./)?notes-private\\.md\\s*$"`. Plain `git reset` (unstages both) still fails.

**4.10-B (nit).** "With paths it works on the staging area only, so it is never destructive." A staged version that differs from the working tree is lost. Change "never destructive" to "your files on disk are never touched".

### 4.11 Clean untracked files

**4.11-A (major, X2). "Dry run first" is the point of the lesson (LESSONS.md: "teach dry-run first as a habit") and it is not enforced.**
Tested: `git clean -fd` then `git clean -n` passes. So does `rm -rf scratch.txt tmp` plus `git clean -n` plus `git clean -f`.
Fix (tested): replace goal 1 with
```json
{ "label": "Do a dry run first", "sticky": true, "check": { "type": "all", "checks": [
  { "type": "usedCommand", "matches": "^git clean\\b.*(\\s-[a-zA-Z]*n|--dry-run)" },
  { "type": "pathExists", "path": "firmware/scratch.txt" },
  { "type": "pathExists", "path": "firmware/tmp" } ] } }
```
Tested: `-n` then `-fd` passes; `-dn`/`-df`, `--dry-run -d`/`--force -d` and `-n -d`/`-f -d` pass; the wrong order fails. Remove the ordering bullet from the author's notes.

Destructive overreach is caught: `-fdx` fails "Keep the ignored files"; `-f` without `-d` fails (tested).

### 4.12 Choose the right undo

**4.12-A (major). The text names the commands for the required skills, which gives away the decision the lesson teaches.**
File: `4.12/content.md`:
> 1. **Is the change committed?** If not, you are working on files or the staging area: `restore`, `restore --staged`, `clean`.
> 2. **Has anyone else got the commit?** If the commit is only on your machine, `reset` can rewrite it away. If others may have it, add a `revert` commit instead and leave history alone.

Why: the recall rule says never to show the command for a `requires` skill, and the whole skill here (`undo-decision`) is mapping a situation to a tool. Hint 1 already maps them for learners who need help.
Fix:
> 1. **Is the change committed?** If not, you only need to work on the files or the staging area: throw away edits, unstage, or delete untracked files.
> 2. **Has anyone else got the commit?** If the commit is only on your machine, you can move the branch back and redo it. If others may have it, add a new commit that undoes it and leave history alone.

**4.12-B (nit).** "Each case had one fitting answer." Case 1 works with a soft or a mixed reset (both tested) or with `rm --cached` + `--amend`. Fix: "Each case had a fitting kind of undo."

Robustness is very good: an alternative (mixed reset, manual edit for case 2, `restore --staged --worktree .`, `reset report.md`) passes; `rm --cached` + `--amend`, `restore -S` pass; reverting case 1 and the over-destructive `reset --hard HEAD~1` everywhere fail (tested).

### 4.13 Boss: rescue a messy repo

**4.13-A (minor). Whether the personal file must be deleted from disk is unclear, and 4.12 case 1 taught the opposite.**
File: `4.13/content.md`: "A personal file was staged by accident and does not belong in the project at all." The goal requires `pathAbsent inventory/notes-personal.txt`. In 4.12, the accidentally committed `secret.env` had to *stay* on disk.
Fix: "A personal file was staged by accident. It should not be committed, and it should not be left lying in the project folder either."

**4.13-B (minor). Reverting first fails with a hint that points to stash, which is not taught.**
Verified: `git revert HEAD` with the staged file prints "error: your local changes would be overwritten by revert. hint: commit your changes or stash them to proceed." Committing them is the wrong move here.
Fix, hint 2: "Deal with the working tree and staging area first (git will not revert while something is staged): throw away the edit, drop the staged junk, remove the clutter. Then undo the bad commit with a new commit so the history stays intact."

**4.13-C (minor).** `requires: [section]`, see X3.

Robustness is very good: `reset --hard` + `clean -fd` + `revert`, `restore --source=HEAD~1 tests` + commit, `rm --cached` + `checkout --` all pass; `clean -fdx`, `reset --hard HEAD~1` and `add -A` commit fail (tested).

---

## Fixtures

- `bakery.sh`: deterministic, the marks are correct, and the header shape matches the real graph. Verified: 15 commits on main and 16 with `--all`; there are 55 objects and none share a 4-character prefix. Two nits: the header lists `reformat` before the seasonal commits, while date order puts seasonal-1 first, which is harmless. Also see 3.03-A for an optional time tweak.
- `weather.sh`: correct. Verified: HEAD~4 is `bug`, and blame reaches `bug` through the merge and Porto rewrite. See 3.13-B for deleting `fix-units`.
- Rename detection relies on `diff.renames` defaulting to true (git ≥ 2.9). The app's isolated config must not set it to false (the author noted this).

---

## Alternative-approach tests run

All runs used `canopy-lesson test --solution <file>`. Section 3 ran against the live tree before the 14.09 breakage; section 4 and the "with proposed fix" runs used the snapshot `--lessons /tmp/claude-1000/review34/lessons`. Files are in `/tmp/claude-1000/review34/`.

**Current goals (unmodified)**

| File | What it does | Result | Expected? |
|---|---|---|---|
| a-3.01-short | `-3 --oneline`, prefix answer `8357` | ok | yes |
| a-3.01-n3nospace | `-n3` | ok | yes |
| a-3.01-maxcount | `--max-count=3` | FAIL limit goal | no, 3.01-A |
| w-3.01-max30 | `-30` | FAIL limit goal | yes |
| w-3.01-graphcount | answers 16 (graph count) | FAIL answer | yes (see 3.01-B) |
| a-3.02-nodecorate | `--graph --oneline --all` | ok | yes |
| w-3.02-noall | no `--all` | FAIL | yes |
| w-3.02-giveaway | answers `dark-mode`, `v1.0` | ok | no, 3.02-A |
| a-3.03-spaced | `--author Sam`, `--since 2024-03-11 --until ...` | ok | yes |
| a-3.03-variants | `--author="Sam Chen"`, `--after/--before`, answer `:/typo` | FAIL typo answer only | `:/` never resolves (harmless) |
| a-3.04-follow-first | `--follow` first, `--stat`, no `--` | ok | yes |
| a-3.04-cdpages | `cd pages; git log -- menu.md` | FAIL path goal | no, 3.04-A |
| a-3.04-ptrailing | `git log --follow pages/menu.md -p` | FAIL | yes, git itself rejects a trailing `-p` (exit 128) |
| a-3.05-tagfirst | answer `3.5` | ok | yes |
| a-3.05-sha | `git show 35f7316:menu.md` | FAIL v0.1 goal | no, 3.05-A |
| a-3.06-7char | 7-char id, `git show 3ad`, full id | ok | yes |
| w-3.06-bogus | `git show 0000` / 40 zeros (exit 128) | FAIL | yes, failed commands do not count |
| w-3.06-giveaway | answer `v1.0` | ok | no, 3.06-B |
| a-3.07-commitall | `log -1`, `commit -am` | ok | yes |
| a-3.07-bareshow | plain `git show` | FAIL look goal | no, 3.07-B |
| w-3.07-amend | `commit -a --amend` | FAIL | yes |
| w-3.07-giveaway | answer `HEAD`, no commit | FAIL commit goals (answer accepted) | partially, 3.07-A |
| a-3.08-log | `git log -1 HEAD~2`, `HEAD~3^2` | ok | yes |
| a-3.08-at | `git show @~2`, `v1.0^2` | FAIL `~` goal | no, 3.08-C |
| w-3.08-giveaway | answers `HEAD~2`, `HEAD~3^2` | ok | no, 3.08-B |
| a-3.09-dots | `A..B`, with path | ok | yes |
| w-3.09-worktree | `git diff --stat HEAD`, `git diff v1.0` | ok | no, 3.09-A |
| a-3.10-longopts | `--ignore-all-space`, `--name-only`, `--stat` last | ok | yes |
| w-3.10-now | `git diff -w`, `git diff --name-only` (no commits) | ok | accepted, 3.10-C |
| a-3.11-L4 | `-L4,4`, `show --stat` | ok | yes |
| a-3.11-regexL | `-L /Baguette/,+1`, `git show 8357bc78` | FAIL `-L` goal | no, 3.11-B |
| w-3.11-showhead | `git show HEAD` | ok | no, 3.11-A |
| a-3.12-head | `describe HEAD`, `describe HEAD~3` | FAIL tagged goal | no, 3.12-A |
| a-3.12-tags | `describe --tags` | FAIL HEAD goal | no, 3.12-A |
| a-3.13-other | `log --stat v1.0..v1.1`, plain blame, quoted answer | ok | yes |
| w-3.13-giveaway | answer `fix-units` | merged-tip accepted | no, 3.13-B |
| a-4.01-dashdash | `git restore -- notes.txt` | ok | yes |
| a-4.01-worktree / -W | `--worktree`, `-W` | FAIL restore goal | no, 4.01-C |
| a-4.01-checkout | `git checkout -- notes.txt` | FAIL restore goal | acceptable (lesson is about restore) |
| w-4.01-all | `git restore .` | FAIL todo goals | yes |
| w-4.01-both | `restore notes.txt todo.txt` | FAIL todo goals | yes |
| w-4.01-order | restore, then diff | ok | no, 4.01-B |
| a-4.02-dashdash | `--staged -- draft.md` | ok | yes |
| a-4.02-S | `-S` | FAIL | no, 4.02-A |
| a-4.02-reset | `git reset draft.md` | FAIL restore goal | acceptable (4.10's lesson) |
| w-4.02-worktree | `--staged --worktree` | FAIL edits goal | yes |
| w-4.02-both | `--staged .` | FAIL | yes |
| a-4.03-space / both | `--source @~1`; `--staged --worktree` | ok | yes |
| a-4.03-s | `-s HEAD~1` | FAIL | no, 4.03-A |
| w-4.03-revert | `revert --no-edit HEAD` | FAIL restore goal | yes |
| w-4.03-toofar | `--source=HEAD~2` | FAIL commit goal | yes |
| w-4.03-reset | `reset --hard HEAD~1` | FAIL | yes |
| a-4.04-noedit | `revert --no-edit @~1` | ok | yes |
| a-4.04-n | `revert -n` + own message | FAIL | no, 4.04-A |
| w-4.04-manual | `rm` + `sed` + "Revert tracking" | ok | no, 4.04-A |
| w-4.04-head / reset | `revert HEAD`; `reset --hard HEAD~2` | FAIL | yes |
| a-4.05-two / open | `-n HEAD HEAD~1`; `--no-commit @~2..` | ok | yes |
| w-4.05-separate / reset | two reverts; `reset --hard` | FAIL | yes |
| a-4.06-caret / mixed | `HEAD^`; `--mixed HEAD~1` | ok | yes |
| w-4.06-soft / hard | `--soft`; `--hard` | FAIL | yes |
| w-4.06-giveaway | answer `main` | ok | no, 4.06-A |
| a-4.07-at / amend | `@~2`; soft 1 + `--amend` | ok | yes |
| w-4.07-toofar / hard / mixed-addall | `HEAD~3`; `--hard`; stylesheet left out | FAIL | yes |
| a-4.08-caret | `--mixed HEAD^` | ok | yes |
| a-4.08-at / q | `@~`; `-q HEAD~1` | FAIL reset goal | no, 4.08-B |
| w-4.08-addall / hard | `add .`; `reset --hard` | FAIL | yes |
| a-4.09-sha | `--hard @~2` | ok | yes |
| w-4.09-one / three / mixedrestore | `HEAD~1`; `HEAD~3`; mixed + `restore .` | FAIL | yes |
| w-4.09-order | reset, then status | ok | no, 4.09-B |
| a-4.10-dash | `git reset -- file` | ok | yes |
| a-4.10-head / headdash / q | `reset HEAD file`; `reset HEAD -- file`; `-q` | FAIL | no, 4.10-A |
| w-4.10-all / restore | `git reset`; `restore --staged` | FAIL | yes |
| a-4.11-dn / long / sep | `-dn/-df`; long options; separate flags | ok | yes |
| w-4.11-x / nod | `-fdx`; `-f` only | FAIL | yes |
| w-4.11-order / rm | clean before dry run; `rm -rf` | ok | no, 4.11-A |
| a-4.12-alt / amend | mixed reset, manual edit, `restore -SW .`, `reset file`; `rm --cached` + `--amend`, `restore -S` | ok | yes |
| w-4.12-overreach / revert1 | `reset --hard HEAD~1` everywhere; revert in case 1 | FAIL | yes |
| a-4.13-hard / restore / rmcached | three different valid routes | ok | yes |
| w-4.13-x / resethard / commitall / revertfirst | `-fdx`; `reset --hard HEAD~1`; `add -A`; revert with staged junk | FAIL | yes |

**With proposed fixes (snapshot)**

| File | Proposed change | Result |
|---|---|---|
| reference solutions, sections 3–4 | all proposals applied | 26 ok, `validate` 0 errors |
| a-3.01-maxcount / w-3.01-max30 | 3.01-A | ok / FAIL |
| a-3.02-nodecorate (answer 0) | 3.02-A choice | ok |
| a-3.04-cdpages | 3.04-A | ok |
| a-3.05-sha | 3.05-A | ok |
| p-3.06-noshort / p-3.06-nonhex | 3.06-A refusal goal (no short try / `git show xyz`) | FAIL / FAIL (reference with `git show 3ad`: ok) |
| a-3.07-bareshow | 3.07-B | ok |
| q-3.08-at | 3.08-C | ok |
| w-3.09-worktree / a-3.09-dots | 3.09-A | FAIL / ok |
| a-3.11-regexL / w-3.11-showhead | 3.11-A/B | ok / FAIL |
| a-3.12-head / a-3.12-tags | 3.12-A | ok / ok |
| p-3.13-naive | 3.13-A/B (naive HEAD~4 option, `fix-units`) | FAIL both questions |
| q-4.01-W / q-4.01-worktree / q-4.01-both | 4.01-C | ok / ok / FAIL |
| p-4.01-order | 4.01-B sticky | FAIL |
| q-4.02-S | 4.02-A | ok |
| q-4.03-s | 4.03-A | ok |
| a-4.04-n / w-4.04-manual / a-4.04-noedit | 4.04-A | ok / FAIL / ok |
| q-4.08-at / q-4.08-q | 4.08-B | ok / ok |
| p-4.09-order | 4.09-B sticky | FAIL |
| q-4.10-head / headdash / q / w-4.10-all | 4.10-A | ok / ok / ok / FAIL |
| p-4.11-order / p-4.11-nfirst-nod / q-4.11-dn, long, sep | 4.11-A sticky | FAIL / ok / ok |

Not tested (text-only or JSON written by inspection): 3.06-B (text question), 3.07-A, 3.08-B, 4.06-A (choice questions), X3 `requires` lists. They use only documented fields; run `validate` after applying them.
