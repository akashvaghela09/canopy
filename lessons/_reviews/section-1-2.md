# Review: sections 1 and 2 (lessons 1.01 to 2.14)

Reviewer: independent senior review, 2026-10-03. No lesson files were edited. All proposed goal JSON marked "tested" was applied to a scratch copy (`/tmp/claude-1000/review/fixed`) and run through `canopy-lesson test` with the reference solution and the alternative solutions listed at the end.

## Overall verdict

The lessons are well written, short, accurate on most git behaviour, and every reference solution passes (`validate`: 47 lessons, 0 errors, 0 warnings; `test 1 2`: 21 tested, 0 failed). Tone and length meet the brief.

Goal robustness has real problems, though:
- **1.04 cannot work as designed in the app.** The app's shared global gitconfig already holds a placeholder identity by the time the learner opens 1.04, so two of its five goals pass at the start. A learner can finish the lesson without setting their own name. (blocker)
- **2.11 and 2.12 reject approaches the lessons themselves suggest.** 2.11 says to add `secrets.env` to `.gitignore`; 2.12 says renaming in the files panel works. (major)
- **2.14 does not check its main requirement**, "each change its own commit". (major)
- 1.01 calls the current folder "the working directory", which clashes with "working tree" from 2.03 onward. (major)

Counts: **1 blocker, 4 major, 15 minor, 25 nit** (2.01-A, 2.02-A and 2.06-C are instances of X2/X3 and are not counted twice).

The author's notes are partly out of date. `canopy-lesson test` now re-checks goals after every command (`crates/canopy-core/src/harness.rs`, the loop around lines 106 to 141, with sticky goals latched at line 140). So the "sticky goals cannot be proven" gap no longer exists, and 1.01 and 2.04 can go back to state checks (fixes below, tested).

---

## Cross-cutting

**X1 (minor). Author notes say sticky goals cannot be tested. This is no longer true.**
File: `lessons/_notes/section-1-2.md`, "Sticky intermediate goals cannot be proven by `canopy-lesson test`".
Why: this led to `usedCommand` regexes in 1.01 and 2.04 that reject valid forms or accept the wrong order. The harness now runs `evaluate_goals` after every prompt marker.
Fix: delete that bullet. Apply the 1.01 and 2.04 fixes below.

**X2 (minor). "Working tree" is used before it is defined, and 1.01 gives "working directory" a different meaning.**
Files: `1.05/content.md` ("sits in the working tree column"), `2.01/content.md` ("Between your working tree and a commit"). The term is defined only in `2.03/content.md`.
Why: a beginner meets the term three times before it is explained. See also 1.01-A.
Fix: in 2.01, replace the first sentence with: "Git does not save files straight from disk. Between your **working tree** (the files on disk that you see and edit) and a commit sits the **staging area**: ..." In 1.05, change "in the working tree column" to "in the working tree column (the files on disk)".

**X3 (minor). Goal labels say a commit "contains" only certain files. The content (1.06, 2.02) teaches that a commit is a full snapshot.**
Files: `2.02/goal.json` "The new commit contains intro.txt and nothing else". `2.06/goal.json` "Make one new commit containing app.py and README.md only". 2.02's own content says "The commit holds `README.md` (from the first commit) and `intro.txt`."
Why: the label contradicts the lesson text right next to it, on the idea the section is built on.
Fix: 2.02 label: "The new commit adds intro.txt and changes nothing else". 2.06 label: "Make one new commit that changes app.py and README.md only".

**X4 (nit). `usedCommand` regexes do not accept `git -C dir ...`, `git --no-pager ...`, or chained commands where the regex is anchored with `^`.**
Tested: 1.07 with `git -C bakery status` fails "Check the status". 1.01 with `cd notes && ls -a` fails two goals.
Fix: only 1.01 matters in practice (fix below). For git commands, optionally use the prefix `git(\s+(-C\s+\S+|-c\s+\S+|--[a-z-]+))*\s+status\b`.

**X5 (nit). Some `requires` lists leave out skills the task needs as real steps.**
- 2.13 needs staging (hint 3 gives `git add -u`). Add `add` and `add-patterns` to its `requires`.
- 2.10 and 2.12 end with "commit". Add `commit`.
- 2.14 lists 9 ids, but LESSONS.md says "all of section 2". `commit-a`, `diff`, `diff-staged` and `status-short` are not used. That is defensible, but write it down as a deviation in the notes, or use `requires: [section]`.

---

## 1.01 Meet the terminal

**1.01-A (major). Wrong attribution and a clashing term.**
File `1.01/content.md`: "`pwd` prints the folder you are in. Git calls this the working directory."
Why: git does not call the shell's current folder anything. In git, "working directory" is the old name for the **working tree** (git status still prints "discard changes in working directory"). From 1.05 on the course uses "working tree" for the checked-out files. A learner who takes away "working directory = where my terminal is" will misread later hints and messages.
Fix: "`pwd` prints the folder you are in, called the current folder."

**1.01-B (minor). Goal regexes reject valid ways of moving and listing.**
File `1.01/goal.json`, goals "Move into the notes folder" (`^\s*cd\s+(\./)?notes/?\s*$`) and "List files including hidden ones" (`^\s*ls\b.*\s-\w*[aA]`).
Tested: `cd notes && ls -a` fails both goals. `ls --all` fails. `cd "notes"` fails.
Fix (tested; reference solution and all three alternatives pass):
```json
{ "label": "Print the folder you are in", "check": { "type": "usedCommand", "matches": "(^|[;&|]\\s*)pwd\\b" } },
{ "label": "Move into the notes folder", "sticky": true, "check": { "type": "cwd", "path": "notes" } },
{ "label": "List files including hidden ones", "check": { "type": "usedCommand", "matches": "(^|[;&|]\\s*)ls\\b[^;&|]*\\s(-\\w*[aA]\\w*|--all|--almost-all)(\\s|$|[;&|])" } },
```

**1.01-C (nit).** The question also has `accept: ".ideas"`. Add it; beginners often drop the extension.

**1.01-D (nit).** "List files including hidden ones" passes for `ls -a` in any folder, including ones without the hidden file. The answer goal covers the real intent, so leave it.

## 1.02 Make and view files

**1.02-A (nit). The label says "empty", but the check is `pathExists`.**
Tested: `echo hi > notes.txt` passes. Either change the label to "Create notes.txt inside project", or add `{ "type": "fileContent", "path": "project/notes.txt", "equals": "" }`. The label change is safer, because the in-app editor may save a newline.

**1.02-B (nit). The hints are not progressive.** Each one covers a different step (recipe, mkdir, touch/echo) instead of getting more specific about one problem. That is acceptable for a lesson with several steps, but it does not follow the brief.

**1.02-C (nit).** `archive/2023.txt` in setup is never used. Remove it, or have step 1 use it.

## 1.03 What is a repository

**1.03-A (minor). Says git itself names the branch `main`.**
File `1.03/content.md`: "Git also names the first line of history `main`; you will see that name in the graph."
Why: git's built-in default is still `master`. Canopy sets `init.defaultBranch=main` in its own config. Learners will meet `master` outside the app. Also, the graph shows "no commits yet" in this lesson, so the name does not appear there yet.
Fix: "Canopy sets git up to call the first line of history `main` (on other computers it may be called `master`). You will see that name in the graph once there is a commit."

**1.03-B (nit).** "Turn garden into a repository" and "The .git folder exists inside garden" check nearly the same thing. They could be merged. Harmless.

**1.03-C (nit).** A likely mistake: running `git init` in the lesson root without `cd garden`. It makes the whole lesson folder a repo (tested: goals correctly fail), and the learner needs Reset. Hint 1 covers this.

## 1.04 Tell git who you are

**1.04-A (BLOCKER). The global identity goals already pass when the lesson opens in the app.**
Files: `1.04/goal.json` goals "Set user.name globally" and "Set user.email globally" (`config ... present: true`).
Why: `runner.rs::ensure_identity` writes `user.name=Canopy Learner` and `user.email=learner@example.com` into the **shared** app global config (`AppPaths::global_config`, one file for all lessons) whenever a lesson with `identity: true` is prepared. 1.01, 1.02 and 1.03 all use the default `identity: true`. So by the time a learner opens 1.04, both global values are present, and `identity: false` on 1.04 changes nothing. The lesson's main skill can be skipped. `git config --list` also shows a name the learner never set, and the content does not explain it. The harness uses a fresh data folder for each lesson, so `canopy-lesson test` cannot catch this.
Tested: I simulated the placeholder with history-hidden commands (leading space) and then ran only `git config user.email work@example.com` and `git config -l`. Result: **ok** (lesson passes without the learner setting any global identity).
Fix (tested: the placeholder simulation now fails both global goals; the reference solution and two alternatives pass):
```json
{ "label": "Set user.name globally", "check": { "type": "all", "checks": [
  { "type": "config", "key": "user.name", "scope": "global", "present": true },
  { "type": "not", "check": { "type": "config", "key": "user.name", "scope": "global", "value": "Canopy Learner" } } ] } },
{ "label": "Set user.email globally", "check": { "type": "all", "checks": [
  { "type": "config", "key": "user.email", "scope": "global", "present": true },
  { "type": "not", "check": { "type": "config", "key": "user.email", "scope": "global", "value": "learner@example.com" } } ] } },
```
Content: after the paragraph on `--global`, add: "Canopy may have filled in a placeholder (Canopy Learner) so earlier lessons could work. Replace it with your own name and email." (The constants live in `runner.rs`. If they change, these goals must change too. Consider exporting them for lesson use.)

**1.04-B (minor). Wrong description of how config is resolved.**
File `1.04/content.md`: "Git reads from the top down and stops at the first value it finds."
Why: git reads every level (system, then global, then local) and the last value read wins. The result is the same for a single value, but the described mechanism is wrong. It will mislead in 13.xx, where `--get-all` and multi-valued keys come up.
Fix: "Settings live in layers: the global file first, then the repo's `.git/config`. Git reads all of them, and a later value overrides an earlier one, so the repo's own setting wins. That is why `--show-origin` is the quickest way to settle 'which setting is git using?'"

**1.04-C (nit).** The "List your settings" regex rejects `git config list` (the subcommand form from git 2.46). The tested regex `git\s+config\b.*\s(--list|-l|list)(\s|$)` accepts it. It would also match the odd case `git config user.name list`, which is harmless.

## 1.05 Ask git what is going on

No significant findings. Alternatives behave correctly: creating the file with `touch` passes; staging it fails.

**1.05-A (nit).** The question's answer, "Untracked", is printed in the "What just happened" section on the same screen. Consider moving the word "Untracked" out of that section, or asking "Will git include plan.txt in the next save as things stand?" instead.

## 1.06 What is a commit (guided)

No significant findings. All tested routes pass: `git add -A` with the commit message written in the editor, and naming both files with `--message=`. Committing only one file fails, as it should.

**1.06-A (nit).** "`main` and HEAD point at it" is fine for now. Make sure 3.07 ("What is HEAD") does not contradict it.

## 1.07 Boss: set up a project from scratch

**1.07-A (minor). Hint 1 states an order that does not exist.**
File `1.07/lesson.yaml`: "Order matters: make the folder and files first, then turn the folder into a repo, then set your identity inside it."
Tested: `git init bakery`, then the identity, then the files, passes. The only real constraint is that the repo exists before the local identity is set.
Fix: "Make the folder and turn it into a repo before you set a local identity. The files can come before or after."

**1.07-B (nit).** `git -C bakery status` does not satisfy "Check the status" (X4).

## 2.01 Stage a file

**2.01-A (minor).** "Working tree" is used without a definition. See X2.

**2.01-B (nit).** Goal 1 ("Stage intro.txt") is a strict subset of goal 2. It is fine as a progress tick. Tested: `git add ./intro.txt` and `git add intro*` pass; `git add .` and committing both fail.

## 2.02 Commit what is staged

**2.02-A (minor).** The label "contains intro.txt and nothing else" contradicts "The commit holds README.md ... and intro.txt". See X3.

Tested: committing through the editor and with `--message` pass; `git add .` plus commit fails.

## 2.03 Staged vs changed-after-staging

**2.03-A (minor). The commit check accepts a file that lost the staged line.**
File `2.03/goal.json`: `{ "type": "fileContent", "source": "HEAD", "path": "todo.txt", "contains": "buy bread" }`.
Tested: `echo "buy bread" > todo.txt` then stage and commit passes, although the label says to commit the newest version.
Fix (tested):
```json
"check": { "type": "all", "checks": [
  { "type": "fileContent", "source": "HEAD", "path": "todo.txt", "contains": "buy milk" },
  { "type": "fileContent", "source": "HEAD", "path": "todo.txt", "contains": "buy bread" } ] }
```

**2.03-B (nit). Recall rule.** Hint 1 shows `git status`, a required skill, and it is the first hint, not the last. Use "The status can list the same file twice: ..."

Tested: committing with a path (`git commit todo.txt -m`), `commit -am`, and two commits (milk, then bread) all pass. Committing without staging again fails.

## 2.04 Stage many files

**2.04-A (minor). The "-u first" goal passes when `-u` is run after `-A`.**
File `2.04/goal.json`, goal 1 (`usedCommand` only). Its label promises "(src/app.js and old.txt, not the new files)".
Tested: `git add -A; git add -u; git commit` passes, and the intermediate state is never reached.
Fix (tested; the -A-first approach now fails; `--update` with `.`, `-u .` with `-A && commit`, and `-u` then naming the new files all pass):
```json
{ "label": "First, stage only the tracked changes with -u (src/app.js and old.txt, not the new files)", "sticky": true,
  "check": { "type": "all", "checks": [
    { "type": "usedCommand", "matches": "git\\s+add\\b.*\\s(-u|--update)(\\s|$)" },
    { "type": "status", "staged": ["old.txt", "src/app.js"], "untracked": ["notes.txt", "src/new.js"], "exact": true } ] } },
```

**2.04-B (minor). The count is wrong.** `2.04/content.md`: "three forms cover most days:" is followed by four bullets. Fix: "four forms cover most days:".

## 2.05 Write a good commit message

**2.05-A (nit).** The content says "up to about 50 characters" and hint 1 says "under 50", but the check is strictly 1 to 50. Use "50 characters or fewer" everywhere.

**2.05-B (nit).** `\n\n\S` rejects a body that starts with indentation (for example an indented code line). This is rare and acceptable.

Tested: the editor route, a single `-m $'subject\n\nbody'`, and a body that starts with a bullet pass. No body fails. A 63-character subject fails.

## 2.06 Skip the staging step

**2.06-A (nit). The regex rejects combined short flags with `a` after another letter.**
Tested: `git commit -qa -m ...` fails "Commit using the -a flag".
Fix (tested): `"matches": "git\\s+commit\\b.*\\s(-[a-zA-Z]*a[a-zA-Z]*|--all)(\\s|$)"`. `-m "msg" -a`, `--all --message` and `-qa` pass; `git add -u` plus commit still fails.

**2.06-B (nit). One wrong option is not plausible.** "-a skips files that start with a capital letter" is a joke option. Replace it with "-a only commits files that were already staged". That is plausible and wrong.

**2.06-C (minor).** The "containing ... only" label. See X3.

## 2.07 See what changed

**2.07-A (nit).** "Run git diff" is also satisfied by `git diff --staged`, which shows nothing here. The questions still force reading the real diff, so this is acceptable.

**2.07-B (nit).** "The diff panel" is not one of the UI names listed in LESSON_FORMAT §3. Either add it to that list or keep the wording consistent with "the three-area panel".

All three answers were checked against the real diff: the removed line is "Git is a tool", the port is 9090, and there are 2 added lines. A wrong count of 3 fails.

## 2.08 See what is staged

No significant findings. Both questions are correct ("after-restage" is "Both changes", which is right for index versus HEAD). `--cached` as "an older name for the same flag" is accurate. Tested: `--cached` with `add -A`, and `--staged recipe.txt` with `add .`, pass. `commit -am` fails.

**2.08-A (nit). Recall rule.** The content names `git diff`, a required skill, but only to contrast it with the new command. Acceptable.

## 2.09 Read the history

**2.09-A (minor). The "who" question rejects the most likely copy-paste.**
File `2.09/goal.json`, question `who-search`. The log line is `Author: Sam Chen <sam@example.com>`, and learners often copy everything after "Author: ".
Tested: "Sam Chen <sam@example.com>" is rejected.
Fix (tested): `"accept": ["Sam Chen", "Sam", "Chen", "sam@example.com", "Sam Chen <sam@example.com>", "<sam@example.com>"]`.

Checked: the footer commit date is shown as `Sun Mar 3 10:00:00 2024 +0000`, so "3 March 2024" is correct, and git log shows the commit's own +0000 zone, not local time. The commit question accepts `HEAD~3` (fine). `--amend` instead of a new commit fails the count goal, which is correct for "commit the staged change".

## 2.10 Tell git what to ignore

**2.10-A (minor). The `!` negation is taught but never exercised.**
Tested: a `.gitignore` of `build/`, `*.log`, then `git add -f audit.log` passes. Listing `debug.log` and `trace.log` by name (no `*.log`, no `!`) passes. Both are valid git, so the state checks should not reject them, but then the lesson's headline pattern goes unchecked.
Fix: add a question instead of tightening state:
```json
{ "id": "negation", "prompt": "Your .gitignore has *.log and then !audit.log. What happens to audit.log?", "type": "choice",
  "options": ["It is ignored like the other logs", "It is not ignored: the ! line makes an exception", "It is deleted from disk"], "answer": 1 }
```
with the goal `{ "label": "Answer: what ! does", "check": { "type": "answer", "question": "negation" } }`.

**2.10-B (nit).** Step 2 shows `>>` in the main text, not only in a hint, although `>>` was never taught. One clause would do: "(`>>` adds a line to the end of a file)".

Tested: `/build/`, `build/*` with `!/audit.log`, and a two-commit route written via printf (as if from the editor) all pass. No negation, deleting the files, and the original reference solution behave as expected.

## 2.11 Remove files

**2.11-A (MAJOR). Following the lesson's own advice fails the goal.**
File `2.11/content.md`, step 2: "(In real life you would add it to `.gitignore` next.)". Goal "secrets.env is untracked but still on disk" requires `status.untracked: ["secrets.env"]`. An ignored file is not listed as untracked.
Tested: `git rm --cached secrets.env` with `echo secrets.env > .gitignore` and committing both fails.
Fix (tested; the .gitignore route passes, `git add -A` re-tracking still fails):
```json
{ "label": "secrets.env is untracked but still on disk",
  "check": { "type": "all", "checks": [
    { "type": "pathExists", "path": "project/secrets.env" },
    { "type": "fileInRev", "path": "secrets.env", "rev": "HEAD", "present": false },
    { "type": "any", "checks": [
      { "type": "status", "untracked": ["secrets.env"] },
      { "type": "status", "ignored": ["secrets.env"] } ] } ] } },
```

**2.11-B (minor). "as if git had never seen it" is misleading, and the status output is not explained.**
File `2.11/content.md`: "After that the file is untracked, as if git had never seen it."
Why: the example is a committed password file. Before the commit, the status lists `deleted: secrets.env` under "Changes to be committed" **and** `secrets.env` under "Untracked files". `git rm --cached` also prints `rm 'secrets.env'`. Both look alarming to a beginner, and "never seen" understates that the secret is still in history.
Fix: "git prints `rm 'secrets.env'` and the status lists the file twice: as a staged deletion (it leaves the next commit) and as untracked (it is still on disk). After you commit, git no longer tracks it. Older commits still contain it, so a real password committed by mistake must also be changed."

## 2.12 Move and rename files

**2.12-A (MAJOR). The content offers the files panel, but the goal requires typing `mv`.**
File `2.12/content.md`: "Or rename with plain `mv` (or the files panel) and then stage both...". Goal "Rename draft.md to chapter1.md with plain mv" is `usedCommand ^\s*mv\s`.
Tested: renaming without an `mv` command line (simulating the files panel), then `git add .` and commit, fails that goal.
Fix: keep the goal, since the lesson's point is to do it both ways, and make the content consistent. Intro: "Or rename with plain `mv` and then stage both the old name and the new name; git works out that they are the same file. (Renaming in the files panel is the same as plain `mv`.)" Step 2 already says "with plain `mv`", which is fine.

**2.12-B (nit). Rename detection is oversimplified.** "when the contents match, it reports a rename". Git also reports renames when the contents are similar (50% by default). Fix: "when the contents are the same or very similar, it reports a rename."

Tested: `git add -A` and two separate commits with `mv -v` and `git rm` pass. Staging only the new name fails.

## 2.13 Read status in short form

**2.13-A (minor). The example table gives away the answer.**
File `2.13/content.md`: the example uses `a.txt`, `b.txt` and `?? d.txt`, the same names and states as the real repo. So "Which file is untracked?" is answered by the lesson text, not by reading the short status.
Fix: use other names in the example table (`notes.txt`, `todo.txt`, `draft.txt`, ...) and keep the real names only in the target block of step 2.

**2.13-B (nit).** `requires` should include `add` (X5).

Checked the real output: ` M a.txt / A  b.txt / MM c.txt /  D e.txt / ?? d.txt`. The target matches what `git add -u` produces. Tested: `git add a.txt c.txt e.txt`, `git rm e.txt` plus `add`, and `add -A` then `rm --cached d.txt` all pass. `add -A` and committing both fail. The text answer "D.TXT" is accepted (case-insensitive).

## 2.14 Boss: build a small project history

**2.14-A (MAJOR). "Each change its own commit" is not checked.**
File `2.14/goal.json`, goal "Make at least four new commits on main" (`commitCount min 5`).
Tested: doing everything in one commit, then three `--allow-empty` commits (the last with a body), **passes**. Three trivial "wip" edits would pass the same way.
Fix (tested; the padding and one-commit approaches fail; the reference solution, a plain-`mv`/`rm` route and a different commit order all pass. The validator warns "uses a shell check", which is expected for the escape hatch):
```json
{ "label": "Make each change its own commit (ignore rules, rename, removal, new file)",
  "check": { "type": "all", "checks": [
    { "type": "commitCount", "range": "main", "min": 5 },
    { "type": "shell", "script": "set -e; f(){ git log --no-renames --format=%H --diff-filter=$1 -- \"$2\" | tail -n 1; }; a=$(f A .gitignore); b=$(f A utils.py); c=$(f D old_notes.txt); d=$(f A cart.py); test -n \"$a\" -a -n \"$b\" -a -n \"$c\" -a -n \"$d\"; test $(printf '%s\\n' $a $b $c $d | sort -u | wc -l) -eq 4" } ] } },
```
(`--no-renames` matters: with rename detection, `utils.py` shows as R, not A.)

**2.14-B (minor). The body requirement appears only in the goal list.** The text says "a clear message" but never says the last commit needs a body. A learner who makes the `.gitignore` commit last, with a one-line message, fails and does not know why. Fix: append to the content: "Give your last commit a body as well as a subject: say why, not only what."

**2.14-C (nit).** "Read the history" (`usedCommand git log`) passes if `git log` is run before any work. That is fine for a boss lesson.

---

## Alternative-approach tests run

All were run with `./target/debug/canopy-lesson test -v <id> --solution /tmp/claude-1000/review/<file>.yaml`. The lessons were read from a snapshot copy of sections 1 and 2 (`/tmp/claude-1000/review/orig`), because another author was writing lesson 6.03 at the same time and the live catalog failed to load mid-review. "fixed" means the run used the proposed goal JSON.

| Lesson | Solution file | Kind | Result |
|---|---|---|---|
| 1.01 | 1.01-alt-chained (`cd notes && ls -a`, `cd ../photos`) | valid | **FAIL** (cd, ls goals); ok with fix |
| 1.01 | 1.01-alt-ls-all (`ls --all`) | valid | **FAIL** (ls goal); ok with fix |
| 1.01 | 1.01-alt-abs (`ls -a notes`, `cd "notes"`, `cd photos/`, answer `ideas.txt`) | valid | **FAIL** (cd goal); ok with fix |
| 1.01 | 1.01-wrong-noexplore (`ls -a` only in root) | weak | ok (answer guarded by question) |
| 1.02 | 1.02-alt-paths (`mkdir -p`, `touch project/..`, `printf >`, answer "3") | valid | ok |
| 1.02 | 1.02-wrong-root (files created outside project) | wrong | FAIL (correct) |
| 1.02 | 1.02-wrong-notcat (text in notes.txt) | wrong-ish | ok (nit 1.02-A) |
| 1.03 | 1.03-alt-initpath (`git init garden`, answer ".GIT") | valid | ok |
| 1.03 | 1.03-wrong-rootinit (`git init` in lesson root) | wrong | FAIL (correct) |
| 1.03 | 1.03-wrong-mkdir (`mkdir garden/.git`) | wrong | FAIL (correct) |
| 1.03 | 1.03-alt-master (`git init -b trunk`) | off-spec | FAIL (correct per curriculum) |
| 1.04 | 1.04-alt-forms (single quotes, `--show-origin --list`) | valid | ok |
| 1.04 | 1.04-alt-editlocal (append `[user]` to .git/config) | valid | ok |
| 1.04 | 1.04-wrong-globalwork (work email set globally) | wrong | FAIL (correct) |
| 1.04 | 1.04-wrong-placeholder (app placeholder identity, no global set) | wrong | **ok (blocker)**; FAIL with fix |
| 1.05 | 1.05-alt-touch | valid | ok |
| 1.05 | 1.05-wrong-staged | wrong | FAIL (correct) |
| 1.06 | 1.06-alt-addA-editor (`add -A`, message written in editor) | valid | ok |
| 1.06 | 1.06-alt-named (`--message=`) | valid | ok |
| 1.06 | 1.06-wrong-onefile | wrong | FAIL (correct) |
| 1.07 | 1.07-alt-initfirst (`git init bakery` first, files last, `status -s`) | valid | ok |
| 1.07 | 1.07-alt-outside (`git -C bakery ...`) | valid | **FAIL** ("Check the status"; nit X4) |
| 1.07 | 1.07-wrong-global / -staged / -emptyfiles | wrong | FAIL (correct, each) |
| 2.01 | 2.01-alt-dotslash, 2.01-alt-glob | valid | ok |
| 2.01 | 2.01-wrong-all, 2.01-wrong-commit | wrong | FAIL (correct) |
| 2.02 | 2.02-alt-editor, 2.02-alt-longflag | valid | ok |
| 2.02 | 2.02-wrong-all | wrong | FAIL (correct) |
| 2.03 | 2.03-alt-pathspec, -alt-commita, -alt-twocommits | valid | ok |
| 2.03 | 2.03-wrong-norestage | wrong | FAIL (correct) |
| 2.03 | 2.03-wrong-onlybread (drops "buy milk") | wrong | **ok (minor)**; FAIL with fix |
| 2.04 | 2.04-alt-dot, -alt-named, -alt-uthenA-commitA | valid | ok (also ok with fix) |
| 2.04 | 2.04-wrong-Afirst (`-A` then `-u`) | wrong | **ok (minor)**; FAIL with fix |
| 2.04 | 2.04-wrong-nou (names tracked files instead of `-u`) | off-lesson | FAIL (intended) |
| 2.05 | 2.05-alt-editor, -alt-ansic, -alt-bullets | valid | ok |
| 2.05 | 2.05-wrong-nobody, -wrong-longsubject | wrong | FAIL (correct) |
| 2.06 | 2.06-alt-flags (`--all --message`), -alt-ma (`-m .. -a`) | valid | ok |
| 2.06 | 2.06-alt-va (`-qa`) | valid | **FAIL** (nit); ok with fix |
| 2.06 | 2.06-wrong-addu, -wrong-addA | wrong | FAIL (correct, also with fix) |
| 2.07 | 2.07-alt-perfile (diff per file, answer "9090" as text) | valid | ok |
| 2.07 | 2.07-wrong-count | wrong | FAIL (correct) |
| 2.08 | 2.08-alt-cached-addA, -alt-filearg | valid | ok |
| 2.08 | 2.08-wrong-commit (`commit -am`) | wrong | FAIL (correct) |
| 2.09 | 2.09-alt-oneline (`--oneline`, `-3`, answer `HEAD~3`, "sam chen") | valid | ok |
| 2.09 | 2.09-alt-fullauthor ("Sam Chen <sam@example.com>") | valid | **FAIL** (minor); ok with fix |
| 2.09 | 2.09-wrong-amend, -wrong-commitq | wrong | FAIL (correct) |
| 2.10 | 2.10-alt-slashes (`/build/`), -alt-buildstar (`build/*`, `!/audit.log`), -alt-editor-twocommits (explicit names, two commits) | valid | ok |
| 2.10 | 2.10-wrong-nonegation, -wrong-delete | wrong | FAIL (correct) |
| 2.10 | 2.10-wrong-force (`add -f audit.log`, no `!`) | bypass | ok (minor 2.10-A) |
| 2.11 | 2.11-alt-plainrm, -alt-commita | valid | ok |
| 2.11 | 2.11-alt-twocommits-gitignore (lesson's own .gitignore advice) | valid | **FAIL (major)**; ok with fix |
| 2.11 | 2.11-wrong-addA (re-tracks secrets.env) | wrong | FAIL (correct, also with fix) |
| 2.11 | 2.11-wrong-deletesecrets | wrong | FAIL (correct) |
| 2.12 | 2.12-alt-addA, -alt-twocommits (`mv -v`, `git rm` + `add`) | valid | ok |
| 2.12 | 2.12-alt-filespanel (rename without an `mv` command) | valid per content | **FAIL (major)** |
| 2.12 | 2.12-wrong-halfstaged | wrong | FAIL (correct) |
| 2.13 | 2.13-alt-named, -alt-rm (`status -s -b`), -alt-addA-uncache | valid | ok |
| 2.13 | 2.13-wrong-addA, -wrong-commit | wrong | FAIL (correct) |
| 2.14 | 2.14-alt-plaincmds-bodies (plain mv/rm, explicit ignore names), -alt-cartfirst (other order, `.gitignore` last with body) | valid | ok (also ok with fix) |
| 2.14 | 2.14-wrong-onecommit | wrong | FAIL (correct) |
| 2.14 | 2.14-wrong-padding (one real commit + 3 empty) | wrong | **ok (major)**; FAIL with fix |
| 2.14 | 2.14-wrong-ignoredeleted (`rm --cached` old notes) | wrong | FAIL (correct) |

With all proposed goal changes applied (1.01, 1.04, 2.03, 2.04, 2.06, 2.09, 2.11, 2.14): `canopy-lesson test 1 2 --lessons /tmp/claude-1000/review/fixed` gives 21 tested, 0 failed, and `validate` gives 0 errors and 1 warning (the 2.14 shell check).
