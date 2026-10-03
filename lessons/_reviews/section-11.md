# Review: section 11, Detective work (lessons 11.01 to 11.13)

Reviewer: independent senior review, 2026-10-03. No lesson files were edited. All three fixtures were built in scratch (`/tmp/claude-1000/review11/fx/`) and every planted answer was checked with real git 2.43. Proposed goal JSON and fixture changes marked "tested" were applied to a scratch copy (`/tmp/claude-1000/review11/lessons`) and run through `canopy-lesson test`. Alternative solutions are in `/tmp/claude-1000/review11/alt/` (live catalog) and `/tmp/claude-1000/review11/alt2/` (scratch copy with the fixes).

## Overall verdict

The section is technically strong. Every planted answer is correct: pickaxe `-S` versus `-G`, `log -L`, `blame -w/-C/--ignore-rev(s-file)`, the bisect paths (36, 50, 43, 39, 41, 40 for the sum bug; 36, 22, 29, 32 skip, 33, 34, 35 for the fix), range-diff markers, shortlog counts (also with `--since` at UTC+14 and UTC-12), `--contains`, `name-rev`, `grep` at a revision, `--diff-filter` and `--follow`. `validate`: 225 lessons, 0 errors (no section-11 warnings). `test 11`: 13 tested, 0 failed. All four bisect lessons end with `git bisect reset` and enforce it (`operation: null` + `currentBranch: main`; leaving with `git switch main` correctly fails).

The main weakness is the one the lead asked about: **several answers can be guessed without the technique the lesson teaches.**
- The commit messages give away the answer in 11.01 ("Add legacy_total..." / "Remove legacy_total"), 11.07 ("Accept negative numbers"), 11.12 ("Move USAGE.md to docs/usage.md") and 11.04 ("Add summer discount code"). (major, X1)
- The bisect goals pass when the learner skips the search: `git bisect start; git bisect bad; git bisect reset` plus a guessed answer completes 11.05. `git bisect run true` completes 11.06. A bare `git bisect skip` completes 11.07. (major, X2, tested fix)
- In 11.06, `fmt.sh` has one commit after it was created, so `git log -- fmt.sh` gives the answer. (major)
- 11.10's own text shows the `name-rev` answer (`tags/v1.1~3`) and the branch answers. (major)

Also: 11.07 tells the learner that `bash tally.sh -2 5` prints 3. It prints -2, because the sum bug from 11.05 is still on `main`. (major)

Counts: **0 blocker, 5 major, 13 minor, 12 nit.**

---

## Cross-cutting

**X1 (major). Planted answers are written in the commit messages.**
Fixture `lessons/_lib/fixtures/s11-shop.sh`: "Add legacy_total for old carts", "Remove legacy_total" (11.01 asks which commits added and removed `legacy_total`; `git log --oneline` answers it). "Move USAGE.md to docs/usage.md" (11.12 asks for the old name). "Add summer discount code" (11.04 asks who added the SUMMER line; `git log --format='%h %an %s' -- pricer/discounts.py` answers it). Fixture `s11-bisect.sh`: "Accept negative numbers" (11.07 asks which commit made tally accept negative numbers).
Why: the brief requires that the answer is found with the technique taught. Today a learner who reads `git log --oneline` gets these answers with no pickaxe, follow or bisect. The `usedCommand` goals make them run the command, but not use its result.
Fix (tested; `test 11` on the scratch copy: 13/13 ok):
```
s11-shop.sh:   commit "Add legacy_total for old carts"   -> commit "Accept prices stored as strings"
               commit "Remove legacy_total"              -> commit "Clean up cart.py"
               commit "Move USAGE.md to docs/usage.md"   -> commit "Reorganize the docs"
               commit "Add summer discount code"         -> commit "Extend the discount table"
s11-bisect.sh: 36) ... msg="Accept negative numbers"     -> msg="Tidy up the input loop"
```
Follow-ups: in `11.03/goal.json` change the option `"Remove legacy_total"` to `"Clean up cart.py"`. Update the fixture header comments. Update 11.04 hint 2, which hardcodes `b64a802`; see 11.04-C. With these changes, `-S legacy_total` lists `155b436 Accept prices stored as strings` and `3b0d739 Clean up cart.py`, and `--follow` still lists 4 commits.

**X2 (major). The bisect goals pass without a real search.**
Files: `11.05/goal.json`, `11.06/goal.json`, `11.07/goal.json`. The only technique checks are `usedCommand` for `bisect start` and for `good|bad|run` (11.05), for `bisect run` (11.06), and for a terms command plus `bisect skip` (11.07).
Tested on the live catalog, all **pass**:
- 11.05: `git log --oneline -- tally.sh; git bisect start; git bisect bad; git bisect reset`, plus the guessed answer.
- 11.06: `git bisect start HEAD v2.0; git bisect run true; git bisect reset`, plus the guess from `git log -- fmt.sh`.
- 11.07: `git bisect start --term-old=broken --term-new=fixed; git bisect skip; git bisect reset`, plus the guess from the message.
Fix (tested): add a sticky goal that latches only when the bisect has narrowed to one commit, and that commit is the right one. The harness re-checks after every command, so the goal latches before `bisect reset` removes the refs. Insert after the "Mark commits..." goal in 11.05, and after the `bisect run` goal in 11.06:
```json
{ "label": "Let bisect narrow the search down to one commit", "sticky": true,
  "check": { "type": "all", "checks": [
    { "type": "refAt", "ref": "refs/bisect/bad", "target": "@mark:bug" },
    { "type": "shell", "script": "t=$(git rev-parse --git-path BISECT_TERMS); { read -r new; read -r old; } < \"$t\" 2>/dev/null || { new=bad; old=good; }; b=$(git rev-parse -q --verify \"refs/bisect/$new\") || exit 1; [ \"$(git rev-list --count \"$b\" --not $(git for-each-ref --format='%(objectname)' \"refs/bisect/$old-*\"))\" = 1 ]" } ] } }
```
(11.06: `"target": "@mark:fmt-bug"`.) 11.07 lets the learner choose the terms, so the ref name is not fixed. There the shell script also checks the behaviour at the narrowed commit and at its parent:
```json
{ "label": "Let bisect narrow the search down to one commit", "sticky": true,
  "check": { "type": "shell", "script": "t=$(git rev-parse --git-path BISECT_TERMS); { read -r new; read -r old; } < \"$t\" 2>/dev/null || { new=bad; old=good; }; b=$(git rev-parse -q --verify \"refs/bisect/$new\") || exit 1; [ \"$(git rev-list --count \"$b\" --not $(git for-each-ref --format='%(objectname)' \"refs/bisect/$old-*\"))\" = 1 ] && git show \"$b:tally.sh\" | bash -s -- -2 5 >/dev/null 2>&1 && ! git show \"$b^:tally.sh\" | bash -s -- -2 5 >/dev/null 2>&1" } }
```
Results with the fix: the reference solutions and all valid alternatives pass, including manual marking, `bisect run`, `old`/`new`, custom terms and `--term-good/--term-bad`. The three guess runs above now fail, and so does `git bisect bad <guessed id>`. The validator adds "uses a shell check" warnings, which other sections already accept.

**X3 (minor). The author notes are out of date on `shortlog`.**
File `lessons/_notes/section-11.md`, first bullet of "Environment facts": "In the harness that swallowed the rest of the solution." The harness now runs the shell in a PTY. Tested: bare `git shortlog -sn` and `git shortlog -sn --since=2024-03-10` work in a solution (`alt/11.09-a-bare.yaml`: ok). Fix: replace the bullet with "In the app and the harness (both PTYs) bare `git shortlog` reads HEAD; it reads stdin only when stdin is not a terminal (scripts, pipes)." See 11.09-A.

**X4 (nit). The `^git <cmd>` regexes reject `git --no-pager <cmd>` and `git -C dir <cmd>`.** Tested: `git --no-pager log --oneline -S legacy_total` fails 11.01's "-S" goal. This is the same as X4 in the section 1-2 review. If wanted, use the prefix `^git(\s+(-C\s+\S+|-c\s+\S+|--[a-z-]+))*\s+log\b`.

---

## 11.01 Search history for text

**11.01-A (major).** The answers are in the commit messages. See X1.

**11.01-B (minor). "Nothing in between" is wrong, and step 3 of the same lesson shows it.**
`content.md`: "keeps only commits where the number of occurrences of that text changed in a file: the commit that introduced it, the commit that deleted it, nothing in between." Step 3 then has the learner run `-S apply_discount`, which lists **three** commits: "Add discount codes", "Apply discount before tax" (it adds a call) and "Add tests for discounts".
Fix: "...keeps only commits that changed how many times the text appears in a file: usually the commit that introduced it and the one that removed it, plus any commit that added or removed another use of it. Commits that only edit lines around it are skipped."

**11.01-C (minor). Confusing spacing advice.** "Put the text right after `-S` with no space, or quote it: `-S"legacy total"`." The lesson's own command is `-S legacy_total`, with a space, and it works. Fix: "If the text contains spaces, quote it: `-S 'legacy total'`." Single quotes also avoid history expansion if the text contains `!`.

**11.01-D (nit).** Step 3 asks "Which commit introduced it?" but there is no question for it. That answer is not in a commit message, so it would make a good non-guessable question: `commit`, answer `@mark:discounts-add`.

## 11.02 Search history by pattern

All checks passed. `-S TAX_RATE` lists 2 commits ("Add VAT helper", "Add pricer skeleton"). `-G 'TAX_RATE ='` lists 3 commits ("Fix tax rate", "Tidy tax constants", "Add pricer skeleton"). `-S 'TAX_RATE = 0.20'` also finds the bug, which matches what the lesson teaches.

**11.02-A (nit).** `-G TAX_RATE` (without ` =`) lists 5 commits, including "Round totals to cents", because the `return round(... TAX_RATE ...)` line was rewritten. That is a clear example of "-G finds rewrites of a line". Consider one sentence in "What just happened". The count question names the exact pattern, so it is not ambiguous.

## 11.03 History of a function or lines

The answers are correct. `-L :total:pricer/cart.py` and `-L 6,12:pricer/cart.py` both list the skeleton, Round, Apply discount and Handle empty carts. The plain path log lists 10 commits.

**11.03-A (minor). Wrong description of how `:funcname` is found.**
`content.md`: "git looks for a line starting with that name, which works for `def total` in Python". The line starts with `def`, not `total`. Git treats `<funcname>` as a regex and searches for the first function-header line that matches it (by default, a line that starts with a letter, `_` or `$`). Tested: `-L :otal:pricer/cart.py` also finds the function.
Fix: "`-L :<name>:<file>` finds the first line that looks like a function header (by default, a line starting at the left margin) and matches the name, so `:total:` finds `def total(...)`. The block runs to the next such line."

**11.03-B (nit).** If X1 is applied, rename the option "Remove legacy_total" to "Clean up cart.py". This was tested.

## 11.04 Blame, properly

The answers are correct. Plain blame credits SUMMER to Jordan b64a802. `-w` and `--ignore-rev` credit Priya b133418. Plain blame of `format.py` credits Sam. `-C` credits Alex `^43e461c pricer/cart.py`. `-M` alone still credits Sam, as the lesson implies. The note "full 40-char ids in the ignore file" is right: `b64a802` and `b64a8024c` both give `fatal: invalid object name`, exit 128.

**11.04-A (minor). Valid forms are rejected.**
Tested on the live catalog:
- `git blame -wC pricer/format.py` fails "Blame with copy detection (-C)", because the regex is `\s-C`.
- Setting `git config blame.ignoreRevsFile .git-blame-ignore-revs` and then running plain `git blame` fails "Use an ignore-revs file". This is how projects actually use the file.
Fix (tested; `alt2/11.04-a`, `-b-bundled`, `-c-config` pass; the guess-from-log run still fails three goals):
```json
{ "label": "Blame while ignoring the reformat (-w or --ignore-rev)",
  "check": { "type": "usedCommand", "matches": "^git blame\\b.*(\\s-[A-Za-z]*w|--ignore-whitespace|--ignore-rev)" } },
{ "label": "Use an ignore-revs file", "sticky": true,
  "check": { "type": "any", "checks": [
    { "type": "usedCommand", "matches": "^git blame\\b.*--ignore-revs-file" },
    { "type": "all", "checks": [
      { "type": "config", "key": "blame.ignoreRevsFile", "present": true },
      { "type": "usedCommand", "matches": "^git blame\\b", "last": true } ] } ] } },
{ "label": "Blame with copy detection (-C)",
  "check": { "type": "usedCommand", "matches": "^git blame\\b.*\\s-[A-Za-z]*C" } }
```

**11.04-B (minor).** "Add summer discount code" by Priya answers `who-summer` and `summer-commit` without blame. See X1.

**11.04-C (nit).** Hint 2 hardcodes `git rev-parse b64a802`. That id changes with any fixture edit before 02-20, including X1, where it becomes `d2856d0`. Use: "For the file, use the full id: `git rev-parse <short id> > .git-blame-ignore-revs`."

**11.04-D (nit).** Add one sentence to content: "Projects usually set `git config blame.ignoreRevsFile .git-blame-ignore-revs` once, so plain `git blame` skips them." This matches 11.04-A.

## 11.05 Find the bad commit by bisecting

The path was verified: 36 good, 50 bad, 43 bad, 39 good, 41 bad, 40 good, then "7242c83 is the first bad commit". The "56 commits, six tests" claim holds. Commits 30 to 32 also fail `tests/sum.sh` (syntax error), but the v2.0..HEAD path never visits them.

**11.05-A (major).** The bisect can be skipped. See X2 (tested fix).

**11.05-B (minor). "Watch the graph: the window shrinks each time" is not true in the app.**
`crates/canopy-core/src/snapshot.rs` `read_refs` reads only `refs/heads`, `refs/tags` and `refs/remotes`. `refs/bisect/*` never reaches the graph. The learner sees HEAD move and a "Bisect" operation badge (`GraphPane.tsx:151`), but no good/bad marks and no window.
Fix: either change step 3 to "Watch the graph: HEAD jumps to a new commit each time, never in order", or record an app gap: show `refs/bisect/bad` and `good-*` in the graph (the curriculum's "Vis: the search window narrowing on the graph").

## 11.06 Bisect automatically

`bisect run bash check-fmt.sh` finds `e768c5f Use printf in fmt`. The exit-code text is correct: 0 good, 1 to 127 bad except 125 skip, anything else aborts.

**11.06-A (major). `fmt.sh` has one change after creation, so `git log --oneline -- fmt.sh` gives the answer.** X2 also lets `bisect run true` pass.
Fix (tested): add decoy commits to `fmt.sh` in existing filler slots. The commit count does not change, so the 11.05 and 11.07 paths stay the same (re-verified). In `s11-bisect.sh`, add `fmt_v2` (adds `# usage: bash fmt.sh CENTS`, `cents=${1:-0}`) at commit 20, "Default fmt to zero cents". Change `fmt_bug` to keep those lines. Add `fmt_help` (a `--help` line on top of the bug) at commit 60, "Add --help to fmt". The exact diff:
```
+fmt_v2() {  write fmt.sh '#!/usr/bin/env bash' '# fmt: print cents as euros, e.g. 1205 -> 12.05' \
+            '# usage: bash fmt.sh CENTS' 'cents=${1:-0}' 'echo "$((cents / 100)).$(printf "%02d" $((cents % 100)))"' }
 fmt_bug(): replace 'cents=$1' with '# usage: bash fmt.sh CENTS' 'cents=${1:-0}'
+fmt_help() { as fmt_bug, plus after the usage line:
+            'if [ "${1:-}" = "--help" ]; then echo "usage: fmt CENTS"; exit 0; fi' }
+    20) fmt_v2; msg="Default fmt to zero cents" ;;
+    60) fmt_help; msg="Add --help to fmt" ;;
```
(Single quotes around `cents=${1:-0}` are required. In double quotes, the function's own `$1` is expanded when the fixture is built.) Checked: v2.0 prints 12.05, commit 53 and later print 12.5, and `git log -- fmt.sh` shows four candidates. Add the X2 goal with `@mark:fmt-bug`.

## 11.07 Bisect vocabulary and edge cases

The path was verified: 36 fixed, 22 broken, 29 broken, 32 (exit 2) skip, 33, 34, 35 broken, "d2a34b8 is the first fixed commit". Skipping costs one extra step: 7 steps versus 6 when 32 is marked broken. The content's claim is right.

**11.07-A (major).** "Accept negative numbers" is the answer, in the message. See X1. `git log --oneline --grep negative` gives it.

**11.07-B (major). Wrong output stated.**
`content.md` step 1: "`bash tally.sh -2 5` prints 3 and exits 0." On `main` it prints **-2**, because the sum bug from 11.05 (commit 41, drops the last argument) is still there. Verified: `-2`, exit 0. The intro also says "today `bash tally.sh -2 5` works". A learner who just did 11.05 will think the lesson is broken, or will doubt that negative numbers are fixed.
Fix, step 1: "Confirm the current behaviour: `bash tally.sh -2 5` exits 0 (it prints -2, not 3, because of the bug you found in the last lesson; for this search only the exit code matters). At `v2.0` it printed an error and exited 1." Intro: "today `bash tally.sh -2 5` is accepted".

**11.07-C (minor). Valid approaches are rejected.**
Tested on the live catalog:
- `git bisect start --term-good=broken --term-bad=fixed HEAD v2.0` fails "Use custom or old/new terms". `--term-good`/`--term-bad` are documented synonyms.
- `git bisect run sh -c 'bash -n tally.sh || exit 125; ...'` fails "Skip an untestable commit". 11.06 teaches that exit code 125 is the same as `git bisect skip`.
Fix (tested; `alt2/11.07-a`, `-b-goodbad-terms`, `-c-run` pass, `-w-guess` fails): use a state check for the skip. A skip leaves `refs/bisect/skip-<id>`, so make the goal sticky:
```json
{ "label": "Use custom or old/new terms",
  "check": { "type": "usedCommand", "matches": "^git bisect\\b.*(--term-(old|new|good|bad)\\b|\\b(old|new)\\b)" } },
{ "label": "Skip an untestable commit", "sticky": true,
  "check": { "type": "shell", "script": "git for-each-ref 'refs/bisect/skip-*' | grep -q ." } }
```

**11.07-D (nit).** "`good`/`bad` are just the default names" uses a banned word. Use "are the default names".

**11.07-E (nit).** Merges bullet: consider adding "With `git bisect start --first-parent` (git 2.29+) it stays on the main line and treats each merge as one step." It is optional, but it is the practical answer to "bisecting through merges".

## 11.08 Compare two versions of a series

The output was verified: `1: 2fc7236 = 1: 15687b6 Round half up...`, `2: fce076d ! 2: 0cd5eeb Add rounding tests` with `++def test_rounds_down`, and `3: 7b31049 < -: ------- Note rounding in docs`. The base form `git range-diff main topic/rounding-v1 topic/rounding` gives the same result. The author is right that `A...B` drags in main's commits: it also pairs "Note rounding in docs" with "Document discount codes".

**11.08-A (minor). The `++`/`--` explanation is wrong for `--`.**
"where `++`/`--` lines are additions and removals in the new version". The first column belongs to the diff of the two patches; the second column is the patch's own `+`/`-`. So `++` is an added line that only the new version adds. `--` is a removed line that only the old version removed, so it is **not** a removal in the new version. `+-` is a removal that only the new version makes.
Fix: "a diff of the two patches follows: the first `+`/`-` says whether the line is new or gone in the second version, the second is the patch's own `+`/`-`; so `++` is a line the new version adds that the old one did not."

**11.08-B (nit).** "a rebase onto a new base shows as `=` as long as the change itself is the same". Range-diff compares hunks including context, so changed context lines can also produce `!`. Consider "...as long as the change and its surrounding lines are the same".

## 11.09 Summarize contributions

The counts were verified: Alex 9 (including the merge; 8 with `--no-merges`, still top), Sam/Priya/Jordan 7. Since 2024-03-10: Jordan 2, others 1, the same in TZ=Pacific/Kiritimati and Etc/GMT+12. `v1.0..v1.1`: Priya 2. `--all` would give Priya 12, but the question says "On main".

**11.09-A (minor). The stdin warning is outdated and takes up space in the lesson.**
Content: "Name the revision: with none, and no terminal attached, `shortlog` waits for log text on standard input instead of reading the repo." Hint 3 is the same point. In the app (a PTY), bare `git shortlog -sn` works, and now so does the harness (X3). The warning is accurate only for scripts, and hint 3 does not help answer anything.
Fix: show `git shortlog -sn` as the first command. Reduce the warning to "(In scripts, give a revision such as `HEAD`: with no terminal attached, shortlog reads standard input.)". Replace hint 3 with "The period question: `git shortlog -sn --since=2024-03-10`. Jordan has two commits since then."

**11.09-B (nit).** "Limit shortlog to a period" accepts only `--since`. `--after=2024-03-10` is a synonym and is rejected (tested). Fix (tested): `"matches": "^git shortlog\\b.*--(since|after|until|before)\\b"`.

## 11.10 Which branches or tags contain this

The answers were verified: `tag --contains` gives v1.1; `branch --contains` gives main and topic/rounding; `--is-ancestor ... v1.0` gives 1; `name-rev` gives `tags/v1.1~3` (and `--tags` gives the same). Tag v1.1 is 3 hops away and main is 8, so the tag name is stable across git versions.

**11.10-A (major). The lesson text shows two answers.**
- `content.md`: "`name-rev` ... names a commit relative to the nearest ref, such as `tags/v1.1~3`". That is exactly the correct option of the `name-rev` question.
- "What just happened" is visible from the start and says: "`topic/rounding` ... contains the fix; `topic/rounding-v1` ... does not, and neither does the `release/0.2` maintenance branch." Only `main` and `feature/cli` are left, and both are easy to infer.
Fix: example: "such as `tags/v3.2~4`, four commits before tag v3.2". Replace the last paragraph with: "\"Contains\" is reachability: a ref contains a commit when you can walk from the ref back to it through parents. A branch rebased onto a newer `main` picks the fix up; a branch that still starts from an older release does not, however recent its own commits are."

## 11.11 Search the code at any revision

The answers were verified: at v0.1 only `pricer/cart.py:15` mentions `legacy_total`; at v1.0 `tax.py` has 2 TAX_RATE lines; `apply_discount` first appears at v0.2 (v0.1 has none).

**11.11-A (minor). The goal accepts only `vN.N` revisions.**
`"matches": "^git grep\\b.*\\bv\\d+\\.\\d+\\b"`. Tested: `git grep -n legacy_total 1f0131d`, `git grep ... main~20` fail "Search an old revision with git grep". The lesson title is "at any revision".
Fix (tested; `alt2/11.11-a`, `-b-sha` pass; working-tree-only `git grep -n TAX_RATE` fails): `"matches": "^git grep\\b.*\\s(v\\d+(\\.\\d+)*|[0-9a-f]{7,40}|HEAD|main)([~^]\\d*)*(\\s|$)"`.

**11.11-B (nit).** The content's third example `git grep -l apply_discount v0.2` is the answer to the "earliest" question. Use `v1.0` in the example.

## 11.12 Find a deleted or renamed file

The answers were verified: Jordan `bd066ec Remove unused config file` (`delete mode 100644 config/defaults.toml`); `--follow` gives 4 commits against 3 without it; the old name is `USAGE.md`.

**11.12-A (minor). The old-name answer accepts `usage.md`.**
Text answers are case-insensitive by default, so `usage.md`, the current base name, is accepted (tested: `alt/11.12-w.yaml` passes). On Linux and in git, `USAGE.md` and `usage.md` are different paths, and this question is about getting exactly that right.
Fix (tested; the reference solution, `alt2/11.12-a` and `-b` pass, `-w` fails): add `"caseSensitive": true` to `old-name`.

**11.12-B (minor). The task does not need the new tool.**
The question names `config/defaults.toml`, so `git log -- config/defaults.toml` (a prerequisite, log-path) answers who deleted it. The rename message spells out the old name (X1). `--diff-filter=D` matters when you do not know the path.
Fix: content intro: "Someone removed a config file a while ago, and nobody remembers its name or who did it." Change the `who-deleted` prompt to "Who deleted the config file?". Add a text question "Which file was deleted?" with accept `["config/defaults.toml"]` and `caseSensitive: true`.

## 11.13 Boss: bug hunt

The answers were verified on the built `ledger` repo: regression `847ad62 Simplify balance formatting` (Sam); plain blame on the balance line gives Jordan `f1e7594`, `-w`/`--ignore-rev` give Priya `89cdb8c`; the fix is in v2.2 and v2.3 and not in `maint/2.1`; export was renamed to `tools/export-csv.sh`; NOTES.txt was removed by Jordan. `bisect start v2.1 v2.0` + `run bash tests/balance.sh` works. Leaving without `bisect reset` fails (tested).

**11.13-A (minor). Messages make most answers easy to guess.** `git log --oneline v2.0..v2.1` shows six commits, five of them "Record expense" or "Release" plus "Normalize indentation", so "Simplify balance formatting" stands out. "Move export script to tools/" and "Remove stale notes" answer two more questions. A boss lesson rests entirely on its questions, so consider neutral messages: 14 "Tidy report()", 18 "Reorganize scripts", 8 "Clean up the repo root".

**11.13-B (nit). The fixture header has the wrong authors.** `s11-ledger.sh` header: commit 4 is "Sam" (it is Jordan), 6 is "Priya" (Sam), 26 is "Alex" (Sam). The author index is `(i-1) % 4`. The answers are not affected.

---

## Alternative-approach tests

Live catalog (`/tmp/claude-1000/review11/alt/`):

| Lesson | Solution | Kind | Result |
|---|---|---|---|
| 11.01 | `log -p -S'legacy_total' -- pricer/cart.py` | valid | ok |
| 11.01 | `--pickaxe-regex -S 'def legacy_'` | valid | ok |
| 11.01 | `log --grep legacy_total` + answers | wrong | fails "-S" goal (answers still guessable, X1) |
| 11.01 | `git --no-pager log -S ...` | valid | fails "-S" goal (X4) |
| 11.02 | `-G'TAX_RATE\s*=' -- pricer/cart.py` + `show` | valid | ok |
| 11.02 | `log -p -GTAX_RATE` | valid | ok |
| 11.02 | `-S 'TAX_RATE = 0.20'` only | wrong | fails "-G" goal |
| 11.03 | `-L :total:...` without `--oneline` | valid | ok |
| 11.03 | `-L '/^def total/,/return round/:...'` | valid | ok |
| 11.03 | path log + guessed answers | wrong | fails "-L" goal |
| 11.04 | `--ignore-rev <short>`, `--ignore-revs-file=` with `-L 4,4`, `-C -C` | valid | ok |
| 11.04 | bundled `-wM`, `-wC` | valid | **fails -C goal** (11.04-A) |
| 11.04 | `config blame.ignoreRevsFile` + plain blame | valid | **fails ignore-revs goal** (11.04-A) |
| 11.04 | log guess + short id in ignore file | wrong | fails 3 goals |
| 11.05 | `start HEAD v2.0` + `run bash tests/sum.sh` | valid | ok |
| 11.05 | manual, `good v2.0` first, `bad main`, `bash tally.sh 2 3 5` as the test | valid | ok |
| 11.05 | `start; bad; reset` + guessed answer | wrong | **ok (X2)** |
| 11.05 | `run`, then `git switch main` (no reset) | wrong | fails reset goal |
| 11.06 | script outside the repo, `run sh ../check-fmt.sh` | valid | ok |
| 11.06 | `run sh -c 'test ...'` inline | valid | ok |
| 11.06 | `run true` + guess from `log -- fmt.sh` | wrong | **ok (X2, 11.06-A)** |
| 11.07 | built-in `new`/`old` + skip | valid | ok |
| 11.07 | `--term-good/--term-bad` + `run` with 125 | valid | **fails terms + skip goals** (11.07-C) |
| 11.07 | `--term-old/--term-new` + `run` with 125 | valid | **fails skip goal** (11.07-C) |
| 11.07 | message guess + bare `bisect skip` | wrong | **ok (X1, X2)** |
| 11.08 | `range-diff main topic/rounding-v1 topic/rounding` | valid | ok |
| 11.08 | explicit `~3..` / `~2..` ranges | valid | ok |
| 11.08 | logs + tip diff, no range-diff | wrong | fails range-diff goal |
| 11.09 | bare `git shortlog -sn` (PTY) | valid | ok |
| 11.09 | `-s -n -e HEAD`, `--summary --numbered --since="..."` | valid | ok |
| 11.09 | `--after=2024-03-10` | valid | **fails period goal** (11.09-B) |
| 11.09 | `log --format=%an \| sort \| uniq -c` | wrong | fails both shortlog goals |
| 11.10 | `branch -a --contains`, `--is-ancestor && echo`, `name-rev --tags` | valid | ok |
| 11.10 | `describe --contains` + content-derived answers | wrong | fails 3 goals (answers given by content, 11.10-A) |
| 11.11 | `-l`, pathspec, three revisions at once | valid | ok |
| 11.11 | revision as id / `main~20` | valid | **fails grep goal** (11.11-A) |
| 11.11 | working-tree grep only | wrong | fails grep goal |
| 11.12 | `--name-status`, `--follow` without `--` | valid | ok |
| 11.12 | `--stat --diff-filter=D`, `--follow --name-status`, answer `./USAGE.md` | valid | ok |
| 11.12 | path log + answer `usage.md` | wrong | **ok** (11.12-A) |
| 11.13 | `-G` pickaxe, `--ignore-rev`, `--is-ancestor`, `--follow` | valid | ok |
| 11.13 | manual bisect + reset, `blame -w`, `branch -a --contains` | valid | ok |
| 11.13 | `run`, then `switch main` (no reset) | wrong | fails "No bisect left running" |

Scratch copy with all proposed fixes (`/tmp/claude-1000/review11/alt2/`, hashes replaced by `@mark:` or the new ids): `validate` 0 errors; `test 11` 13/13 ok. Every valid row above passes, including the previously failing 11.04 bundled/config, 11.07 term-good/run-125, 11.09 `--after` and 11.11 id/relative revision. Every wrong row fails, including the three X2 guess runs, `git bisect bad <guessed id>` in 11.05, and `usage.md` in 11.12.

## Top 10 findings

1. **X2 (major)**: bisect lessons 11.05, 11.06 and 11.07 pass without a real search. Tested fix: a sticky "narrowed to one commit" goal (refAt + convergence shell).
2. **X1 (major)**: commit messages give away the answers in 11.01, 11.04, 11.07 and 11.12. Tested fixture renames.
3. **11.07-B (major)**: "prints 3" is wrong. `main` prints -2 because the 11.05 bug is still there.
4. **11.06-A (major)**: `fmt.sh` has one candidate commit. Tested decoy commits in filler slots; the bisect paths are unchanged.
5. **11.10-A (major)**: content shows the `name-rev` answer and the branch answers.
6. **11.07-C (minor)**: `--term-good/--term-bad` and `bisect run` with exit 125 are rejected. Tested fix with a skip-ref state check.
7. **11.04-A (minor)**: `-wC` and the `blame.ignoreRevsFile` config route are rejected. Tested regexes.
8. **11.05-B (minor)**: the graph does not show the bisect window (`refs/bisect/*` are not in the snapshot). Reword, or log an app gap.
9. **11.08-A (minor)**: `--` in range-diff output is explained wrongly.
10. **11.12-A/B (minor)**: case-insensitive `usage.md` is accepted, and the deletion task is answerable with plain `git log -- <path>`.

---

## Applied (second pass, 2026-10-03)

All 5 majors, all 13 minors and these nits were applied to the live files: X4 (`--no-pager`/`-C`/`-c` prefix on every section-11 `usedCommand` regex), 11.01-D (new `introduced` commit question for `apply_discount`), 11.02-A, 11.03-B, 11.04-C/D, 11.07-D/E, 11.08-B, 11.09-B, 11.11-B, 11.13-B. 11.05-B was reworded to describe the app's new bisect badges ("the graph marks the commits you call good and bad; the search window is everything between them"). 11.12-B adds a case-sensitive text question for the deleted path and no longer names the file in the content or prompts. 11.13-A neutral ledger messages ("Clean up the repo root", "Tidy report()", "Reorganize scripts"); the 11.13 export option was updated to match. The author notes were updated (X3 and the new decisions).

Results on the live tree after `cargo build -q -p canopy-lesson`: `validate` gives 0 errors (section 11 only has "uses a shell check" warnings, from the narrowing and skip goals); `test 11` passes 13/13. All alternative and wrong solutions in `/tmp/claude-1000/review11/alt3/` were re-run against the live files: every valid approach passes (including `git --no-pager`/`git -C .` in 11.01 and 11.10, and custom-term `bisect run` in 11.13); every wrong approach fails, including all guess-only bisects and `defaults.toml`/`usage.md` text answers. No lesson outside section 11 sources the s11 fixtures or hardcodes their ids or messages.
