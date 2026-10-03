# Review: section 13 (lessons 13.01 to 13.15)

Reviewer: independent senior review, 2026-10-03. No lesson files were edited. Local git is 2.43.0. Alternative and wrong-approach solutions are in `/tmp/claude-1000/review13/alt/*.yaml`. Every proposed goal change marked "tested" was applied to a scratch copy (`/tmp/claude-1000/review13/fixed`) and run with the reference solution and with every alternative listed in the table at the end.

## Overall verdict

The section is accurate on most git details and well paced. Every reference solution passes: `validate` reports 225 lessons, 0 errors (the only section 13 warning is the 13.14 shell check), and `test 13` reports 15 tested, 0 failed. Hard points are handled correctly: `--show-origin`, `extensions.worktreeConfig`, the trailing slash on `gitdir:`, the server-side `pre-receive`, `--renormalize`, union merge through a custom `mergetool`, cone mode on older git, and `--depth`/`--filter` over `file://`. I checked each against real git.

Under the new per-lesson config model most of the content still reads correctly. 13.15's "New machine, empty config" is now literally true. A few places still describe the old model, though, and one question has become wrong:

- **13.01's first question gives the wrong answer.** The system file now holds `user.name = Canopy Learner`. In the harness (no saved profile), `--show-origin` lists `user.name` only from the system file. In the app it lists it twice, once from system and once from global. The keyed answer "global" is wrong in the first case and ambiguous in the second. (major)
- **Four "does the lesson's key step actually happen" goals can be passed without that step.** 13.07 and 13.15: the hook "blocked" goal passes with no hook at all, through `git commit` with nothing staged. 13.10: nothing checks that rerere resolved the second merge, so resolving it by hand twice passes. 13.02: the "pull with autoStash" goal passes with no settings at all, because the pull is a clean fast-forward. (major x4)
- **Unquoted `$PWD` paths break on macOS.** The app data folder there is `~/Library/Application Support/com.canopy.app`, which contains a space. `git clone --depth 1 file://$PWD/origin.git shallow`, as written in 13.13 and 13.14 and in 13.11's tool advice, fails there. (major)
- Several places and the author notes still describe global and system config as shared between lessons. (minor)

Counts: **0 blocker, 6 major, 15 minor, 19 nit** (13.11-D is the 13.11 part of X1 and is not counted twice).

---

## Cross-cutting

**X1 (major). Unquoted `$PWD` in commands the learner is told to type. It fails when the lesson path contains a space, which is the normal case on macOS.**
Files:
- `13.13/content.md` step 1 and `13.13/lesson.yaml` hint 1: `git clone --depth 1 file://$PWD/origin.git shallow`.
- `13.14/content.md` step 1 and `13.14/lesson.yaml` hint 1: `git clone --filter=blob:none file://$PWD/origin.git blobless`.
- `13.11/content.md` step 1: "use the full path; `$PWD/tools/canopy-diff` works from here". The `cmd` string is passed through `eval` by git's tool helper, so an absolute path with a space splits there too, whether `$PWD` is expanded when the config is set or when the tool runs.
- `13.13`, `13.14` and `13.15/solution.yaml` use the same form. That is harmless on Linux CI, but it is the example a reader copies.

Why: Tauri's `app_data_dir()` on macOS is `~/Library/Application Support/com.canopy.app`, and `tauri.conf.json` builds for all targets. Tested: in a folder named `sp ace`, the unquoted clone fails (git prints its usage text). The quoted form `git clone --depth 1 "file://$PWD/origin.git" s2` works and gives a 1-commit clone. Partial clone with quotes also works.
Fix:
- 13.13 content and hint 1: `git clone --depth 1 "file://$PWD/origin.git" shallow`.
- 13.14 content step 1 and hint 1: `git clone --filter=blob:none "file://$PWD/origin.git" blobless`. In step 4, show the treeless form with quotes too if a command is added.
- Quote the same way in the 13.13, 13.14 and 13.15 solutions.
- 13.11: use the relative path. Git runs tool commands from the top of the working tree, so `tools/canopy-diff` works even from a subfolder. Tested: `13.11-relative` runs `difftool` and `mergetool` from `sub/` and passes. See 13.11-D for the text.
The goal regexes still match the quoted forms (tested).

**X2 (minor). The author notes describe the old shared-config model and contain one claim that is no longer true.**
File: `lessons/_notes/section-13.md`.
- Section "Global and system config: what persists in the app": every bullet is obsolete. Global and system files are now per attempt and recreated on Reset. Only a global `user.name`/`user.email` is saved to the profile.
- "13.02 deliberately tells the learner to set the five settings in the repo, not globally ... because `pull.rebase`, `fetch.prune` etc. would change the behaviour of other lessons": obsolete.
- Format gap "includeIf leaks into `--global` reads": false on 2.43. `git config --global --get user.email` inside an included repo returns the global file's own value. `--global` (like `--file`) does not follow includes unless `--includes` is given. Tested in `/tmp/claude-1000/review13/inc1` and in the 13.06 run `13.06-identity-first`, where `git config --global user.email` inside `personal/blog` prints the learner's address.
Fix: replace the "Global and system config" section with:
> Each lesson attempt has its own `GIT_CONFIG_GLOBAL` (Canopy defaults plus the learner's saved name/email, unless `identity: false`) and `GIT_CONFIG_SYSTEM` (fallback identity "Canopy Learner"), both recreated on Reset. Aliases, excludes, includes and hooksPath set with `--global` in one lesson do not reach any other lesson. Only a global `user.name`/`user.email` is copied back to the profile (read with `--no-includes`, so identities that arrive through 13.06/13.15 includes are not saved).

Delete the 13.02 rationale bullet and the "includeIf leaks" gap.

**X3 (nit). `requires` lists leave out skills that the tasks use as real steps.**
- 13.08: renaming the last commit is `amend-message` (or `rebase-i`). Add `amend-message`.
- 13.10: "move `main` back one commit, discarding the merge" is `merge-undo-reset`. Add it.
- 13.02: creates a branch, fetches, pulls and pushes. Add `branch-create`, `fetch` and `push` (and the pull skill id from section 7/9).
- 13.07: stages files. Add `add`.

**X4 (nit, engine, for the lead). The learner's `HOME` is shared across lessons, so git's XDG defaults leak.**
`$HOME/.config/git/ignore` and `$HOME/.config/git/attributes` are read when `core.excludesFile`/`core.attributesFile` are unset, even with `GIT_CONFIG_GLOBAL` set. Tested: `13.05-xdg` creates `~/.config/git/ignore`, and `*.swp` is then ignored with no config at all. In the app that file would apply in every later lesson. This is common advice online, so a learner may well try it in 13.05 or 13.15. No section 13 lesson tells them to. Options: set `XDG_CONFIG_HOME` to a per-attempt folder in `learner_env`, or accept the risk.

---

## 13.01 Config levels

**13.01-A (major). The `origin-name` question has the wrong answer under the new model.**
File `13.01/goal.json`, question "According to --show-origin, which file provides user.name?", answer 1 (global).
Tested: in the harness (fresh data dir, no profile), `git config --list --show-origin` shows `user.name=Canopy Learner` from `.../state/13.01/system.gitconfig` only, and no `user.name` in global. With an identity in global (`13.01-identity`), `--show-origin --get-all user.name` lists both: system `Canopy Learner` and global `Real Learner`. So the answer depends on whether the learner ever set a global identity, and with one set, "which file provides" has two true answers.
Fix (tested): ask about a key that is always in exactly one file, and turn the double `user.name` into a precedence teaching point in the content.
```json
{ "id": "origin-name", "prompt": "According to --show-origin, which file provides init.defaultbranch?", "type": "choice",
  "options": ["The system file", "The global file (Canopy's gitconfig for this lesson)", "This repo's .git/config"], "answer": 1 }
```
Goal label: "Where does init.defaultBranch come from?". The `origin-name` question id and the solution answer `1` stay.

**13.01-B (minor). The content describes global/system as shared and as "outliving" the lesson.**
File `13.01/content.md`:
- "In Canopy, the global file is Canopy's own, and so is the system file. Your real `~/.gitconfig` is never read or changed here."
- Step 5: "Clean up the two levels that outlive this lesson: ..."

Why: both files are per lesson now. The cleanup step teaches `--unset` (keep it), but its stated reason is false.
Fix: replace the paragraph with:
> In Canopy, the global and system files are Canopy's own, and each lesson starts with fresh copies: the global file holds Canopy's defaults and your name and email, the system file holds only a fallback identity, "Canopy Learner". Your real `~/.gitconfig` is never read or changed, and nothing you set at these levels carries into other lessons, except your name and email.

Step 1:
> Run `git config --list --show-origin`. If you set your name in an earlier lesson, `user.name` appears twice: Canopy's fallback in the system file and your own name in the global file. Git reads both, and the later one wins. Answer the two questions in the lesson panel about where `init.defaultbranch` and `pull.rebase` come from.

Step 5:
> Practise removing values: unset `core.abbrev` at the system and global levels, and unset the local `pull.rebase` that was set in this repo. The local and worktree `core.abbrev` can stay.

**13.01-C (nit).** The level list omits the command-line level (`git -c key=value`), which beats all four files. A half sentence after the list would do: "A `-c key=value` on the command line beats them all."

Goal robustness is otherwise good. Setting `--worktree` before enabling the extension (`13.01-wrong-worktree-first`), which silently overwrites the local value, is rejected. So is setting the extension but writing 6 locally (`13.01-wrong-noworktreefile`).

## 13.02 Settings worth knowing

**13.02-A (major). The "observed behaviour" goals do not depend on the settings, and the question's answer describes something that did not happen.**
Files `13.02/setup.sh`, `13.02/goal.json` (goal "Pull brings in Sam's push while README.md stays modified (autoStash)", question `autostash`).
Tested:
- `13.02-wrong-noautostash`: plain `git pull` before any setting, `git fetch --prune`, then the five `git config` lines, then `git push -u origin quick-fix` passes every goal. The work clone has no local commits, and Sam's commit does not touch README.md, so a default pull fast-forwards over the dirty tree with no help.
- With the reference solution, git prints `Updating ... Created autostash ... Fast-forward ... Applied autostash.`. Nothing was rebased, but the keyed answer says "Git stashed it, rebased, and restored it".
- `pull.rebase true` without autoStash refuses ("cannot pull with rebase: You have unstaged changes", exit 128). So the two settings only matter together, and the lesson never makes the learner see that.

Fix (tested): give the learner an unpushed commit, so the branches diverge. A default pull then refuses (git 2.33.1+ divergent-branch rule), a merge-pull creates a merge commit, and only rebase plus autostash gives the target state.
`13.02/setup.sh`, replace the last block with:
```bash
# The learner has an unpushed commit and an uncommitted edit waiting.
goto work
as alex
at 2024-05-02T12:00
write docs/usage.md "# Usage" "" "lantern add <text>"
commit "Add usage notes"
append README.md "" "## Status" "" "Work in progress."
```
Goal 3:
```json
{ "label": "Pull rebases your commit onto Sam's while README.md stays modified (autoStash)", "sticky": true,
  "check": { "type": "all", "checks": [
    { "type": "isAncestor", "ancestor": "@mark:sam-tip", "descendant": "main" },
    { "type": "commitMessage", "rev": "main", "equals": "Add usage notes" },
    { "type": "commitCount", "range": "main --merges", "equals": 0 },
    { "type": "status", "modified": ["README.md"] } ] } }
```
Question option 0: "Git stashed it, rebased your commit onto Sam's, and restored the edit".
Content step 3:
> Sam pushed to `main`, and you have an unpushed commit and an uncommitted edit in `README.md`. Pull. With the settings above git stashes the edit, replays your commit on top of Sam's, and restores the edit. Answer the question in the lesson panel.

Results with the fix: the reference passes, `--global` everywhere passes, manual `stash`/`pull`/`stash pop` passes (acceptable), the no-settings route fails, and `pull.rebase false` (merge) fails.

**13.02-B (minor). The rationale for setting the keys locally is obsolete.**
File `13.02/content.md`: "At home these go in your global config. Here, set them in this repo so the rest of Canopy keeps its defaults." Hint 1: "Set each key in this repo".
Fix:
> At home these go in your global config. Canopy gives each lesson its own global file, so here either level works.

Hint 1: "Set each key with `git config <key> <value>` (in this repo, or add `--global`). The five keys are ...". The checks already read effective values (`13.02-global` passes).

**13.02-C (minor). The autoSetupRemote goal accepts `git push -u origin quick-fix`, which does not use the setting.**
Fix (tested): make goal 5 sticky and require that the most recent command was a plain push:
```json
{ "type": "usedCommand", "matches": "^git push(\\s+(-q|--quiet|-v|--verbose))*\\s*$", "last": true }
```
Add this as the first item of goal 5's `all` and add `"sticky": true` to the goal. `git push --quiet` passes (`13.02-manualstash`). `push -u origin quick-fix` fails.

**13.02-D (nit).** "origin/stale was pruned by a fetch" also passes with `git fetch --prune` or `git branch -dr origin/stale`. The config goal still requires `fetch.prune`, so leave it.

## 13.03 Pretty logs

**13.03-A (minor). The format regex rejects `--format='...'` and `%as`.**
File `13.03/goal.json`, goal 1: `(--pretty=|--format=)\S*format:` requires the literal `format:` prefix. `git log --format='%h %ad %an%d %s' --date=short` is the most common spelling (`--format=<fmt>` is `--pretty=tformat:<fmt>`) and fails (`13.03-format-noprefix`). `%as` (short author date, git 2.21+) fails the `--date=short` check (`13.03-as`).
Fix (tested):
```json
{ "type": "usedCommand", "matches": "^git log\\b.*(--pretty[= ]['\"]?t?format:|--format[= ]).*%h.*%a[ds].*%an.*%d.*%s" },
{ "type": "usedCommand", "matches": "^git log\\b.*(--date[= ]short|%as)" }
```
`--oneline --date=short` still fails (`13.03-wrong-oneline`).

**13.03-B (nit).** `--pretty=format:` puts no newline after the last line, so in the terminal the prompt is glued to it ("...Start the garden journalgarden (main) $"). Add one sentence: "`--format='...'` (or `tformat:`) is the same but ends with a newline, which is nicer in a terminal."

## 13.04 Aliases

**13.04-A (minor). Nothing checks that `wip` is a shell alias.**
Tested (`13.04-wrong-noshell`): `alias.wip 'commit -m wip'`, a manual `git add -A`, then `git wip` passes all goals. The lesson's second idea (`!`, two commands) is skipped.
Fix (tested): goal 2 becomes
```json
{ "type": "all", "checks": [
  { "type": "config", "key": "alias.wip", "scope": "global" },
  { "type": "usedCommand", "matches": "^git config\\b.*\\balias\\.wip\\s+['\"]?!" } ] }
```

**13.04-B (minor). The "List your aliases" regex rejects a quoted pattern.**
`git config --get-regexp '^alias\.'` fails (`13.04-alt`): `\s+\^?alias` does not allow the quote.
Fix (tested): `"^git config\\b.*(--get-regexp\\s+['\"]?\\^?alias|--list|-l\\b)"`.

**13.04-C (minor). "What just happened" implies the aliases stay.**
"Both aliases are plain lines in Canopy's global config." The notes add "kept; useful later", but they are not kept now.
Fix:
> Both aliases are plain lines in this lesson's global config. On your own machine that is `~/.gitconfig`, and they would work in every repository from now on; in Canopy each lesson starts with a fresh global file.

Also checked: `git wip` run from `notes/` works, because shell aliases run from the top level, as the content says.

## 13.05 Ignore globally

**13.05-A (minor). Putting the editor patterns into each repo's `.git/info/exclude` passes the "global" goals.**
Tested (`13.05-wrong-infoexclude`): `core.excludesFile` points to an empty file, and `*.swp`/`.idea/` go into both `info/exclude` files. All goals pass.
Fix (tested): append to goals 2 and 3 (each inherits its repo):
```json
{ "type": "fileContent", "path": ".git/info/exclude", "notContains": ".swp" }
```
The reference and `~/.gitignore_global` with `core.excludesfile '~/.gitignore_global'` (`13.05-home`) still pass.

**13.05-B (nit).** "Its patterns apply in every repository you use" is true on a real machine. Optionally add: "(In Canopy, that means every repository in this lesson; each lesson has its own global config.)" See X4 for the XDG default file.

## 13.06 Different identities for different projects

Accurate. The `gitdir:` trailing-slash rule, absolute paths and `includeIf.gitdir:<dir>/.path` syntax are all correct. Tested with an identity already in the global file (`13.06-identity-first`: `git config --global user.name ...` first, as the app's copied identity would be). The includes come after the `[user]` section, so they win, and both commits carry the right identity. Patterns without the trailing slash fail all three identity goals (`13.06-wrong-noslash`, correct). `--author` overrides fail the effective-config goal (`13.06-wrong-author`, correct).

**13.06-A (nit).** A repo-local `include.path` in each repo (`13.06-wrong-localinclude`) passes, although the label says "conditional includes in the global config". It is a real technique, so leave it.

**13.06-B (nit).** Because Canopy now copies the learner's name and email into the global file, an include only wins if it comes after that `[user]` section. `git config --global` appends, so the taught commands work, but an include pasted at the top in an editor would not. Optional sentence for "What just happened": "Your own name is still in the global file; the include comes later in the file, so for matching repos its values win."

## 13.07 Hooks

**13.07-A (major). "The pre-commit hook blocked a commit" passes with no hook.**
File `13.07/goal.json`, goal 1: `usedCommand ^git commit` with exit 1, plus FIXME in the worktree file.
Tested (`13.07-wrong-nohook`): add FIXME without staging, then `git commit -m x` (nothing staged, exit 1). A hook of `exit 0` (with a `# FIXME` comment) in `hooks/` then passes every goal. The lesson's central behaviour is never verified.
Fix (tested): require that the failing commit was the most recent command and that the FIXME was actually being committed (staged, or `-a`):
```json
{ "label": "The pre-commit hook blocked a commit containing FIXME", "sticky": true,
  "check": { "type": "all", "checks": [
    { "type": "usedCommand", "matches": "^git commit\\b", "exitCode": 1, "last": true },
    { "type": "any", "checks": [
      { "type": "fileContent", "source": "index", "path": "src/app.js", "contains": "FIXME" },
      { "type": "all", "checks": [
        { "type": "usedCommand", "matches": "^git commit\\b.*(\\s-[a-zA-Z]*a|\\s--all\\b)", "exitCode": 1, "last": true },
        { "type": "fileContent", "path": "src/app.js", "contains": "FIXME" } ] } ] } ] } }
```
The `-a` branch is needed. When `commit -a` is blocked, git leaves the real index unchanged, so an index-only check rejected the valid `git commit -am` route (tested before adding it).

**13.07-B (nit).** The `--no-verify` regex rejects combined short flags (`git commit -nam ...`). Fix (tested): `"^git commit\\b.*(--no-verify|\\s-[a-zA-Z]*n)"`.

## 13.08 More hooks

Accurate: `pre-receive` gets `old new ref` lines and rejects the whole push, `--no-verify` cannot skip it, and `pre-push` stdin is `local_ref local_sha remote_ref remote_sha`. Tested: the lesson's pre-push script blocks a `WIP:` commit on a new branch (`13.08-prepush`, exit 1 with the hook's message). `reset --soft` + recommit and `pull --no-rebase origin feature/colors` (post-merge still fires) both pass (`13.08-alt-reset2`).

**13.08-A (nit). The pre-push script prints `fatal: bad object 0000...` on a branch deletion.** Tested with `git push origin --delete feature/colors`: the push still succeeds, but the error is confusing. Add `[ "$local_sha" = 0000000000000000000000000000000000000000 ] && continue` as the first line of the loop, in content and solution.

**13.08-B (nit).** "The server's pre-receive hook rejected a push" accepts any push that exits 1 (e.g. `git push origin nosuchbranch`). Learners push first as told, so leave it.

**13.08-C (nit).** "`post-merge` runs after a merge or pull finishes". It does not run when the merge stops on a conflict, and not after `pull --rebase`. Suggest: "runs after a successful merge (including one made by `git pull`)".

(Missing `amend-message` in `requires`: see X3.)

## 13.09 .gitattributes

**13.09-A (minor). "Files that were committed before the rules existed keep their old line endings until they are re-added" is inaccurate for `text=auto`.**
Tested (`13.09-readd-only`): with `* text=auto`, editing `notes.txt` and running `git add -A` + commit still stores CRLF (`od -c` shows `\r\n`). Git deliberately skips CRLF->LF conversion for `text=auto` paths whose index version already has CR. Only `--renormalize` (or an explicit `text` attribute) converts them.
Fix:
> Files that were committed before the rules existed keep their old line endings, even when you edit and add them again. `git add --renormalize .` re-stages every tracked file through the current rules.

**13.09-B (minor). The rule regexes reject per-path rules that do the same thing.**
File `13.09/goal.json`, goal 1 requires `^\*\.sh`, `^\*\.png`, `^\*\.min\.js`, `^docs/internal\.md`. Tested (`13.09-perfile`): `scripts/build.sh eol=lf`, `assets/logo.png binary`, `vendor/lib.min.js -diff`, `/docs/internal.md export-ignore` fails. The curriculum check is "attributes effective on test files".
Fix (tested; adds one validator warning):
```json
{ "label": ".gitattributes is committed and gives the five files the right attributes", "check": { "type": "all", "checks": [
  { "type": "fileInRev", "rev": "HEAD", "path": ".gitattributes", "present": true },
  { "type": "fileContent", "source": "HEAD", "path": ".gitattributes", "matches": "text=auto" },
  { "type": "shell", "script": "a=$(git check-attr -a -- notes.txt scripts/build.sh assets/logo.png vendor/lib.min.js docs/internal.md) && grep -qxE 'notes.txt: text: (auto|set)' <<<\"$a\" && grep -qx 'scripts/build.sh: eol: lf' <<<\"$a\" && grep -qx 'assets/logo.png: text: unset' <<<\"$a\" && grep -qx 'assets/logo.png: diff: unset' <<<\"$a\" && grep -qx 'vendor/lib.min.js: diff: unset' <<<\"$a\" && grep -qx 'docs/internal.md: export-ignore: set' <<<\"$a\"" } ] } }
```
Together with the existing "clean working tree" goal, the worktree `.gitattributes` equals the committed one, so `check-attr` describes the committed rules.

**13.09-C (nit).** "Leave the working tree clean" passes at start. It is a closing invariant, which is acceptable.

Also verified: the `-diff` question (binary-differs notice) is correct, and `check-attr -a assets/logo.png` prints `binary: set`, `diff: unset`, `merge: unset`, `text: unset`, matching the content.

## 13.10 rerere

**13.10-A (major). Nothing checks that the second merge was resolved by rerere.**
Curriculum check: "second merge resolves automatically". The goals check that `rr-cache` exists, that some `git rerere` subcommand was run, that HEAD was once "Tune the timeout", and that the final merge has `timeout = 90`.
Tested, both pass all goals:
- `13.10-wrong-abort`: merge, `git rerere status`, `merge --abort`, merge again, resolve by hand, commit. The first merge was never committed and no resolution was ever reused.
- `13.10-wrong-norerere`: first merge resolved and committed, reset, `rerere.enabled false`, second merge resolved by hand, `rerere.enabled true` again.

Fix (tested): insert before the final goal:
```json
{ "label": "The second merge came back already resolved by rerere", "sticky": true,
  "check": { "type": "all", "checks": [
    { "type": "usedCommand", "matches": "^git merge\\b", "exitCode": null, "last": true },
    { "type": "operation", "value": "merge" },
    { "type": "fileContent", "path": "config.txt", "contains": "timeout = 90" },
    { "type": "fileContent", "path": "config.txt", "notContains": "<<<<<<<" } ] } }
```
This latches only when a `git merge` leaves a merge in progress with the file already clean, which is exactly rerere's effect. Both wrong routes now fail. The reference passes, and so does `13.10-alt` (`--global` rerere, `ORIG_HEAD` reset, `commit --no-edit`).

The question's expected text matches git's output exactly ("Resolved 'config.txt' using previous resolution."). `rerere status`/`diff` after staging behave as described. (Missing `merge-undo-reset`: see X3.)

## 13.11 Diff and merge tools

**13.11-A (minor). `vscode` is not one of git's built-in tool names.**
`13.11/content.md`: "Git knows many tools by name (`vimdiff`, `meld`, `kdiff3`, `vscode`)". `git mergetool --tool-help` on 2.43 lists no `vscode`; VS Code is set up through `mergetool.<name>.cmd`, exactly as this lesson teaches. Replace `vscode` with `p4merge`.

**13.11-B (minor). The mergetool goal passes if the conflict is resolved by hand and `git mergetool` is run afterwards.**
Tested (`13.11-wrong-manual`): `git mergetool` prints "No files need merging" and exits 0, which satisfies `usedCommand ^git mergetool`.
Fix (tested): have the lesson tool leave a trace and check for it.
`13.11/files/canopy-merge`, before `exit 0`:
```sh
echo "$merged" >> "$(git rev-parse --git-dir)/canopy-merge.log"
```
Goal 3: replace the `usedCommand` item with `{ "type": "pathExists", "path": "project/.git/canopy-merge.log" }`.

**13.11-C (nit). `canopy-diff` prints "canopy-diff: " with nothing after it.** `$BASE` is a helper-shell variable that is not exported to the tool process. Use `echo "canopy-diff: comparing two versions"`, or drop the line.

**13.11-D (minor, part of X1). Use a relative tool path.**
Content step 1:
> Register `canopy` as the diff tool using `tools/canopy-diff`. Git runs tool commands from the top of the working tree, so the relative path works: `git config difftool.canopy.cmd 'tools/canopy-diff "$LOCAL" "$REMOTE"'`. Run `git difftool -y main feature`.

Hint 1 to match. Solution: `git config difftool.canopy.cmd 'tools/canopy-diff "$LOCAL" "$REMOTE"'` and `git config mergetool.canopy.cmd 'tools/canopy-merge "$BASE" "$LOCAL" "$REMOTE" "$MERGED"'`. Tested from a subfolder (`13.11-relative`).

**13.11-E (nit).** "writing the resolved content to `$MERGED` and exiting 0 marks the conflict as resolved". Add "(with `trustExitCode true`; otherwise git checks whether `$MERGED` changed)".

## 13.12 Sparse checkout

Accurate on cone mode (folders plus root files), `set` replacing the list, `.git/info/sparse-checkout`, and `init --cone` for pre-2.37 git. `clone --sparse` + `set` + `add` (`13.12-sparseclone`) and plain `set` on 2.43 (`13.12-nocone-set`) pass. Deleting folders by hand fails (`13.12-wrong-rm`, correct).

**13.12-A (nit).** "A clone always downloads the whole history" is contradicted by the next lesson. Write "A normal clone downloads the whole history".

**13.12-B (nit).** The final goal does not check `mono/mobile` is absent, and goal 4 (on `feature/api-v2`) is not sticky, so switching back to `main` at the end un-passes it. Add `{ "type": "pathAbsent", "path": "mono/mobile" }` to goal 5. Optionally make goal 4 sticky.

## 13.13 Shallow clones

Accurate. Counts are 1, 4 and 12 as the content says. A plain-path `--depth` clone is a full clone and fails all goals (`13.13-wrong-plainpath`, correct).

**13.13-A (minor). Goal regexes reject valid forms, including one the content itself teaches.**
- The content lists `git fetch --depth <n>` ("sets the total depth to `n`"). `git fetch --depth 4` reaches the same 4 commits but fails "Deepen by three commits" (`13.13-depth4`).
- `git clone "file://..." shallow --depth 1` (option after the arguments) fails the clone goal. `git pull --unshallow` fails the last goal (`13.13-optafter`).

Fix (tested):
```json
"^git clone\\b(.*--depth[= ]1\\b.*file://|.*file://.*--depth[= ]1\\b)"
"^git fetch\\b.*(--deepen[= ]3|--depth[= ]4)\\b"
"^git (fetch|pull)\\b.*--unshallow"
```
(Quoting: see X1.)

## 13.14 Partial clones

Accurate. The question answer 7 is right: 12 blobs in history, 5 at HEAD. Transcript: 7, then 4 after `git show` of the root commit. The `.git/config` keys named in the content are right. Canopy's snapshot commands (`log --format`, `for-each-ref`, `ls-files -s`, `reflog`) never read blobs, so the app does not trigger lazy fetches behind the learner's back.

**13.14-A (minor). The `usedCommand` in "first commit's files were fetched on demand" rejects valid ways to trigger the fetch.**
`^git (show|checkout|switch|log -p|diff)\b` rejects `git log --stat`, `git log --oneline -p`, `git cat-file -p`, and so on. Tested: `13.14-logp` uses `git log --stat`, which fetches the blobs, and fails. The shell check alone already proves the fetch: it fails right after the clone and before the clone exists.
Fix (tested): goal 3's check becomes only the shell check:
```json
{ "type": "shell", "script": "root=$(git rev-list --max-parents=0 HEAD) && ! git rev-list --objects --missing=print \"$root\" | grep -q '^?'" }
```

**13.14-B (nit).** A full clone with `remote.origin.promisor`/`partialclonefilter` set by hand passes (`13.14-wrong-full`). It is far-fetched, so leave it.

## 13.15 Boss: set up a workstation

"New machine, empty config" is now accurate: only name and email are copied in. Tested with an identity already in global plus `core.hooksPath`, `* text=auto eol=lf`, `~/.gitignore` excludes and a `--no-checkout` sparse partial clone (`13.15-alt`): passes.

**13.15-A (major). The hook goal passes with a hook that does nothing.**
Same pattern as 13.07-A. Tested (`13.15-wrong-nothingstaged`): `.git/hooks/pre-commit` containing `exit 0`, then `git commit -m x` with nothing staged (exit 1). Everything else done correctly: all goals pass.
Fix (tested): goal 5 becomes
```json
{ "label": "work/app: a pre-commit hook blocked the FIXME commit", "sticky": true,
  "check": { "type": "all", "checks": [
    { "type": "usedCommand", "matches": "^git commit\\b", "exitCode": 1, "last": true },
    { "type": "any", "checks": [
      { "type": "fileContent", "repo": "work/app", "source": "index", "path": "src/notes.js", "contains": "FIXME" },
      { "type": "all", "checks": [
        { "type": "usedCommand", "matches": "^git commit\\b.*(\\s-[a-zA-Z]*a|\\s--all\\b)", "exitCode": 1, "last": true },
        { "type": "fileContent", "repo": "work/app", "path": "src/notes.js", "contains": "FIXME" } ] } ] },
    { "type": "any", "checks": [
      { "type": "pathExists", "path": "work/app/.git/hooks/pre-commit" },
      { "type": "config", "repo": "work/app", "key": "core.hooksPath", "scope": "local" } ] } ] } }
```
`add -N` + `commit -am` (`13.15-commita`) passes with the fix.

**13.15-B (nit).** `minGit: "2.37"` is not needed. `clone --sparse` exists since 2.25, and on older git a non-cone `set api` still gives the checked state. The notice may put off 2.32 to 2.36 users. Consider `"2.25"`.

---

## Alternative-approach tests

"orig" = current lesson files; "fixed" = with the proposed goal/setup changes (`/tmp/claude-1000/review13/fixed`).

| Lesson | Solution file | Kind | orig | fixed |
|---|---|---|---|---|
| all | reference solutions | valid | ok (15/15) | ok (15/15) |
| 13.01 | 13.01-identity (global identity present, `--unset` first, no `--local`) | valid | ok (shows user.name twice; see 13.01-A) | ok |
| 13.01 | 13.01-wrong-worktree-first | wrong | FAIL (correct) | FAIL |
| 13.01 | 13.01-wrong-noworktreefile | wrong | FAIL (correct) | FAIL |
| 13.02 | 13.02-global (`--global` everywhere, `conflictStyle`) | valid | ok | ok |
| 13.02 | 13.02-manualstash (`stash` / pull / `stash pop`, `push --quiet`) | valid-ish | n/a | ok |
| 13.02 | 13.02-wrong-noautostash (pull before settings, `push -u`) | wrong | **ok (major)** | FAIL |
| 13.02 | 13.02-wrong-merge (`pull.rebase false`) | wrong | n/a | FAIL |
| 13.03 | 13.03-tformat-color (`tformat:`, colours, lowercase author) | valid | ok | ok |
| 13.03 | 13.03-format-noprefix (`--format='...'`) | valid | **FAIL (minor)** | ok |
| 13.03 | 13.03-as (`%as`, `--author Priya`) | valid | **FAIL (minor)** | ok |
| 13.03 | 13.03-wrong-oneline | wrong | FAIL (correct) | FAIL |
| 13.04 | 13.04-alt (`add .`, run from `notes/`, `--get-regexp '^alias\.'`) | valid | **FAIL (minor)** | ok |
| 13.04 | 13.04-alt2 (`;` chaining, `--global --list`) | valid | ok | ok |
| 13.04 | 13.04-wrong-noshell (non-shell wip alias + manual add) | wrong | **ok (minor)** | FAIL |
| 13.05 | 13.05-home (`~/.gitignore_global`, `/scratch.md`, `git -C`) | valid | ok | ok |
| 13.05 | 13.05-wrong-infoexclude (patterns in each `info/exclude`) | wrong | **ok (minor)** | FAIL |
| 13.05 | 13.05-xdg (`~/.config/git/ignore`, no config) | off-lesson | FAIL (config goal; see X4) | FAIL |
| 13.06 | 13.06-identity-first (identity in global, `--add`, unquoted key, `git -C`) | valid | ok | ok |
| 13.06 | 13.06-wrong-noslash | wrong | FAIL (correct) | FAIL |
| 13.06 | 13.06-wrong-author (`--author` overrides) | wrong | FAIL (correct) | FAIL |
| 13.06 | 13.06-wrong-localinclude | debatable | ok (nit) | ok |
| 13.07 | 13.07-alt-hookspath-first (`./hooks` first, `commit -am`, `-nam`) | valid | **FAIL (nit, `-nam`)** | ok |
| 13.07 | 13.07-wrong-nohook (nothing-staged commit, no-op hook) | wrong | **ok (major)** | FAIL |
| 13.08 | 13.08-alt-reset2 (`reset --soft`, `pull --no-rebase` merge) | valid | ok | ok |
| 13.08 | 13.08-prepush (pre-push blocks a `WIP:` commit) | behaviour | hook works (exit 1) | — |
| 13.09 | 13.09-perfile (per-path rules, `/docs/...`) | valid | **FAIL (minor)** | ok |
| 13.09 | 13.09-readd-only (edit + re-add, no renormalize) | wrong | FAIL (CRLF kept; see 13.09-A) | FAIL |
| 13.10 | 13.10-alt (`--global`, `ORIG_HEAD`, `--no-edit`) | valid | ok | ok |
| 13.10 | 13.10-wrong-abort | wrong | **ok (major)** | FAIL |
| 13.10 | 13.10-wrong-norerere | wrong | **ok (major)** | FAIL |
| 13.11 | 13.11-relative (relative tool paths, `difftool.prompt false`, from subfolder) | valid | ok | ok |
| 13.11 | 13.11-wrong-manual (hand resolution, then `git mergetool`) | wrong | **ok (minor)** | FAIL |
| 13.12 | 13.12-sparseclone (`clone --sparse`, `checkout`, `add docs`) | valid | ok | ok |
| 13.12 | 13.12-nocone-set (`set` without `init`) | valid | ok | ok |
| 13.12 | 13.12-wrong-rm (delete folders by hand) | wrong | FAIL (correct) | FAIL |
| 13.13 | 13.13-depth4 (quoted URL, `--depth=1`, `fetch --depth 4`) | valid | **FAIL (minor)** | ok |
| 13.13 | 13.13-optafter (`--depth` after args, `--deepen=3`, `pull --unshallow`) | valid | **FAIL (minor)** | ok |
| 13.13 | 13.13-wrong-plainpath | wrong | FAIL (correct) | FAIL |
| 13.14 | 13.14-logp (`git log --stat` triggers the fetch) | valid | **FAIL (minor)** | ok |
| 13.14 | 13.14-wrong-full (full clone + faked promisor config) | wrong | ok (nit) | ok (nit) |
| 13.15 | 13.15-alt (identity in global, hooksPath, `eol=lf`, `--no-checkout` + `set --cone`) | valid | ok | ok |
| 13.15 | 13.15-commita (`add -N` + `commit -am` blocked) | valid | ok | ok |
| 13.15 | 13.15-wrong-nothingstaged (no-op hook, nothing-staged commit) | wrong | **ok (major)** | FAIL |

With all proposed changes applied: `canopy-lesson test 13 --lessons /tmp/claude-1000/review13/fixed` gives 15 tested, 0 failed. `validate --lessons` gives 0 errors; section 13 warnings are the 13.14 shell check and the new 13.09 shell check. No new goal passes at the start; the only goals passing at start are the existing invariants "docs/scratch.md is still untracked" (13.05) and "Leave the working tree clean" (13.09).
