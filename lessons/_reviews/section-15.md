# Review: section 15, Specialist tools (lessons 15.01 to 15.18)

Reviewer: independent senior review, 2026-10-03. First pass edited no lesson files; the findings were then applied to the live tree on request (see the end of this file). Every change marked "tested" was applied to a scratch copy of `lessons/` (`/tmp/claude-1000/review15/lessons`). That copy passes `canopy-lesson validate` (0 errors) and `canopy-lesson test 15` (18 tested, 0 failed). The alternative and wrong solutions listed at the end are in `/tmp/claude-1000/review15/*.yaml`. Git 2.43.0, OpenSSH 9.6p1.

On the live tree: `validate` gives 225 lessons, 0 errors (section 15 has only "uses a shell check" warnings), and `test 15` gives 18 ok.

## Overall verdict

This section is solid and ambitious. Submodule, subtree, patch, bundle, notes, signing and strategy fixtures are small and deterministic. The setups are clever where it matters: 15.13 makes `-X ours` give a visibly different result from `-s ours`, 15.15 places the rename at exactly 20%, and 15.08 makes `am -3` stop on patch 2 and not on patch 1. Sandbox rules are mostly kept. Submodule setups use `-c protocol.file.allow=always` and nothing else. `maintenance start` is never run, and a goal guards against it. `minGit` and `tools` match the version table: 15.12 and 15.18 have `2.34` and `ssh-keygen`; 15.05, 15.06 and 15.18 have `git-subtree`; 15.16 has `2.29`; 15.01 has no `minGit`, which is right because the restriction only exists in newer git and Canopy's config lifts it.

The main problems:

- **15.12 can write into the learner's real `~/.ssh`.** `ssh-keygen` takes its default key path from the passwd entry, not from `$HOME`. I verified this with a fake HOME: it still offered `/home/akash/.ssh/id_ed25519`. A learner who leaves out `-f` and presses Enter writes a key into their real `~/.ssh`, or is asked to overwrite their real key. The lesson gives no warning. (major)
- **15.12 lets a learner commit the private key.** `keys/` is created untracked inside the repo. If the learner stages everything for the CHANGELOG commit, `keys/canopy-key` goes into history (tested). (major)
- **15.14 misdescribes octopus.** With `clash` last, as the lesson orders it, git does *not* refuse. It stops in an ordinary conflicted merge (`MERGING`, "fix conflicts and then commit the result"). Resolving and committing makes a five-parent octopus, which then fails the lesson (tested). Only a conflict in an earlier branch gives the outright refusal ("Should not be doing an octopus."). In that case `git merge --abort` fails because there is no merge to abort (tested). (major)
- **15.06 and 15.09 can be passed by the wrong approach.** In 15.06, copying files by hand passes the "is a subtree" goals, although the lesson's own question calls copying wrong (tested). In 15.09, cloning and pulling straight from `project` passes, with no bundle used (tested). (major, both fixed and tested)
- **15.10 rejects valid `export-ignore` forms**: `/tests`, `/tests/`, and `tests/**`, the form the gitattributes docs recommend (tested). It also accepts an archive of `HEAD` while the `v2.0` tag points at a commit without the attributes. (major + minor, fixed and tested)
- Several goals show as passed before the learner does anything: 15.03 (two goals), 15.04, and 15.12 (the tamper goal). Fixed and tested.
- Text slips: 15.16 says 90 objects, but there are 91. 15.15 calls `ort` the default, which is only true from git 2.34, and Canopy runs on 2.32. 15.10 promises a "byte-identical" `.tar.gz`. 15.09 says the second bundle carries "only what the other side was missing", but `v1.0..main` resends June and July.

Counts: **0 blocker, 6 major, 18 minor, 13 nit.**

On the extra focus points:
- *Submodules:* `protocol.file.allow` is handled in setup with `-c` only. The learner relies on Canopy's global config (`env.rs` `DEFAULT_GLOBAL_CONFIG`), which is correct; see X-1 for one app caveat. Detached HEAD inside the submodule is taught (15.02 question, 15.03 step 1), and pushing from a detached HEAD (`push origin HEAD:main`) also passes (tested). Pointer updates are checked against `lib.git` main. Removal checks all four places. The `--remote` variant passes 15.03 (tested), but the lesson never exercises it (15.03-B).
- *Subtree:* `tools: [git-subtree]` is declared on 15.05, 15.06 and 15.18. `tool_check` detects a missing subtree from "not a git command". Squash plus `subtree push` works and fast-forwards `lib.git`.
- *format-patch/am:* correct. `am -3` behaves as described: patch 1 auto-merges and patch 2 conflicts. Plain `am` fails on patch 1, then `--abort` and `-3` passes (tested).
- *Bundles, archive, notes:* see 15.09, 15.10 and 15.11. Notes are published with `refs/notes/commits` and the `'refs/notes/*'` form (tested).
- *SSH signing:* the key lives in the lesson folder and `SSH_AUTH_SOCK` is not passed to the learner shell (`base_env`), so the learner's agent is never consulted. The two gaps are 15.12-A and 15.12-B.
- *Merge strategies:* `-s ours` vs `-X ours` is correct, and the fixture proves the difference (`-X ours` FAILs the config goal). Octopus: see 15.14-A.
- *Maintenance:* `start` is never run. See 15.16-B for what to do if a learner runs it anyway.
- *patch-id/cherry:* correct. `cherry -v` prints `- - +` as the lesson claims, and the patch ids match and differ as described (transcript checked).

---

## Cross-cutting

**X-1 (minor, app, not lesson). Canopy's `protocol.file.allow=always` exists only on fresh installs.**
`crates/canopy-core/src/env.rs` `AppPaths::ensure` writes `DEFAULT_GLOBAL_CONFIG` only `if !self.global_config().exists()`. Any install whose config file was created before this key was added will make `git submodule add ../lib.git lib` (15.01, 15.06) and `git clone --recurse-submodules` (15.02) fail with `transport 'file' not allowed`.
Fix: on start, ensure the key is present, e.g. run `git config --file <global> protocol.file.allow always` if `git config --file <global> --get protocol.file.allow` is empty.

---

## 15.01 Submodules: add

Accurate. `d87eb66` in "What just happened" matches `@mark:lib-tip` (verified). The absolute-URL variant passes. The wrong approach (`git clone ../lib.git lib` + `git add lib`, an embedded repo without `.gitmodules`) fails, as it should.

**15.01-A (minor). Committing `.gitmodules` and the gitlink in two commits fails.**
`commitChanges` on `HEAD` requires both paths in the last commit. Tested: `git commit .gitmodules -m ...` then `git commit -m ...` gives FAIL, although the end state is the same.
Fix (tested, the two-commit approach then passes and the reference still passes): replace the check of goal "Commit .gitmodules and the lib entry" with
```json
{ "type": "all", "checks": [
  { "type": "fileContent", "source": "HEAD", "path": ".gitmodules", "contains": "path = lib" },
  { "type": "shell", "script": "git ls-tree HEAD lib | grep -q '^160000 '" },
  { "type": "status", "clean": true } ] }
```

## 15.02 Submodules: clone and update

Correct and clear. The `-` prefix in `submodule status` and the detached HEAD are both accurate. Tested passes: `submodule init` + `update`, and `fresh` cloned from `work` followed by `update --init`. Tested failure as it should: `update --init --remote` (gets 1.1).

No findings.

## 15.03 Submodules: working inside

Tested passes: detached commit plus `push origin HEAD:main`, and a separate `lib.git` clone followed by `submodule update --remote lib`. Tested failure as it should: forgetting to publish the library.

**15.03-A (minor). Two goals pass at start.**
"work's commit points at the library's new main" and "app.git main has the new pointer too" are both true at setup, because everything is equal. The app shows them ticked before the learner has done anything.
Fix (tested; the reference and both alternatives still pass, and only "Nothing left uncommitted" passes at start): wrap each in an `all` with `{ "type": "refNotAt", "ref": "main", "target": "@mark:app-tip" }`. For the second goal, add `"repo": "app.git"` to that `refNotAt`.

**15.03-B (minor). `submodule update --remote` is in `teaches` but is never exercised.**
It appears only in prose and hint 3. Fix: add a question.
```json
{ "id": "remote", "prompt": "Sam later pushes lib 1.2 to lib.git. Which command brings lib/ to it, leaving the pointer change for you to commit?",
  "type": "choice", "options": ["git submodule update --remote lib", "git submodule update --init lib", "git pull in the project", "git submodule sync lib"], "answer": 0 }
```
Then add an `answer` goal "Name the command that follows the library's main", and add `remote: 0` to solution.yaml.

## 15.04 Submodules: remove

Correct. `deinit` removes the whole `submodule.lib` section, `git rm` edits and stages `.gitmodules`, and re-adding with a stale `.git/modules/lib` does refuse. `deinit -f -- lib` + `rm -f` passes (tested).

**15.04-A (minor). "The removal is committed" passes at start.** Setup's last commit touches `lib` and the tree is clean.
Fix (tested): put `{ "type": "refNotAt", "ref": "main", "target": "@mark:app-tip" }` first in that goal's `checks`.

**15.04-B (nit). Order matters, and the text does not say so.** If the learner removes the path first, `git submodule deinit lib` fails with `pathspec 'lib' did not match` (tested), so the usedCommand goal (exit 0) can never pass without a reset. Fix: step 1 append "Do this first: once the path is removed, deinit no longer finds it."

## 15.05 Subtree

Accurate. The graph shows the squash commit plus a merge, and `subtree push` after a squashed add fast-forwards `lib.git`. The action is idempotent (run twice: no-op). Tested passes: named remote without `--squash`; action pressed twice before the add; and `subtree split -b` + push.

**15.05-A (minor). Vendoring by hand passes.**
Tested `05-wrong-copy`: clone `lib.git` elsewhere, copy the files into `vendor/lib`, commit, then patch and push from the separate clone. Result: ok. No goal checks that a subtree was used.
Fix (tested; the reference and all three alternatives pass, and the copy FAILs): make the sticky goal
```json
{ "type": "all", "checks": [
  { "type": "fileInRev", "path": "vendor/lib/version.txt", "rev": "HEAD", "present": true },
  { "type": "shell", "script": "git log --format=%B HEAD | grep -q '^git-subtree-dir: vendor/lib$'" } ] }
```
(`subtree add` writes the `git-subtree-dir:` trailer with or without `--squash`.)

**15.05-B (nit).** "`git subtree split --prefix=<dir>`: ... rewrites the folder's history as a standalone branch". It prints a commit id; only `-b <name>` creates a branch. Fix: "rewrites the folder's history as a standalone history and prints its tip (`-b <name>` makes it a branch)."

## 15.06 Submodule or subtree

**15.06-A (major). Copying utils and fonts by hand passes, although the lesson's question calls it wrong.**
Tested `06-wrong-copy` (`git archive` of each library extracted into `vendor/`, then commit): ok. The goals only check for regular files.
Fix (tested; the reference and `06-subtreesfirst` pass, and the copy FAILs): append `&& git log --format=%B HEAD | grep -q '^git-subtree-dir: vendor/utils$'` to the utils script (`vendor/fonts` for fonts).

**15.06-B (minor). `subtree add` refuses while the submodule addition is uncommitted.**
Tested: `fatal: working tree has modifications.  Cannot add.` Only hint 3 explains this. Fix: content, after "Commit so that the project records all three.", add: "`subtree add` needs a clean working tree, so commit the submodule before adding a subtree."

**15.06-C (nit).** fonts: "must be present in every clone" → "must be present in every plain clone". That matches the decision rule in the text and rules out the "Submodule: a pin is best" option without argument.

## 15.07 Make patch files

Correct. Tested passes: `-3 -o patches` on `feature`, combined `--check --stat`, and `--output-directory` with `--stat` run in `project`.

**15.07-A (nit).** "named after the message" → "named after the subject line".

**15.07-B (nit).** `--cover-letter` adds `0000-cover-letter.patch`, which makes the `apply --check` glob fail (tested). Optional fix: use the glob `"$LESSON_ROOT"/project/patches/000[1-9]-*.patch`.

## 15.08 Apply patch files

Accurate. `am -3` output matches the text ("Applying: Add color option" auto-merges; patch 2 conflicts). Tested passes: plain `am`, then `--abort`, then `-3` + `checkout --theirs`; and resolving plain-`am` failures by hand. Tested failure as it should: `--skip`.

**15.08-A (minor, app). The prompt says `REBASING` during an am session.**
The `PS1` in `env.rs` treats any `rebase-apply` folder as a rebase. Learners in an am lesson see `work (main|REBASING) $`.
Fix (app): before the rebase test, add `if [ -f "$__d/rebase-apply/applying" ]; then __o="|AM"; elif ...`. Fix (lesson, if the app is not changed): step 2 append "The prompt shows REBASING: `am` uses the same machinery."

**15.08-B (nit).** "it rebuilds the pre-image from the blob ids in the patch". This works only when the repository has those blobs. Append ", which works because your repository shares that history."

## 15.09 Bundles

**15.09-A (major). The offline copy need not come from a bundle.**
Tested `09-wrong-direct`: create the bundles, then `git clone project offline` and later `git pull` from `project`. Result: ok.
Fix (tested; the reference, fetch + `merge FETCH_HEAD`, and `main ^v1.0` pass, and the direct clone FAILs):
- goal 4: add `{ "type": "remote", "repo": "offline", "name": "origin", "url": "full.bundle" }` to its `checks`; label "offline is a clone of full.bundle with the tag v1.0".
- last goal: `{ "type": "all", "checks": [ <existing shell>, { "type": "usedCommand", "matches": "\\bgit (-C \\S+ )?(fetch|pull)\\b.*\\.bundle\\b" } ] }`; label "offline main is level with project main, via update.bundle".

**15.09-B (minor). `v1.0..main` is not "only the new commits".** It also carries June and July, which `offline` already has. So "the second carried only what the other side was missing" is false.
Fix: step 4 "Make a smaller bundle with only the commits after v1.0: `git bundle create ../update.bundle v1.0..main`. June and July go again, which is harmless; a bundle only needs its base to exist on the other side." What just happened: "The first file was a complete transfer; the second carried only the commits after a point the other side already had, because you named that point. Push does the same negotiation automatically, over a connection instead of a file."

**15.09-C (minor). The range regex rejects `main ^v1.0` and `git -C project bundle create`.**
Fix (tested): `"\\bgit (-C \\S+ )?bundle create\\b.*(\\S\\.\\.\\S|\\s\\^\\S)"`.

## 15.10 Archives

**15.10-A (major). Valid `export-ignore` patterns are rejected.**
Real git (tested on a scratch repo): `/tests`, `/tests/`, `tests/` and `tests` all drop the folder entirely. `tests/**`, the form `gitattributes(5)` recommends, drops the files but leaves an empty `tests/` entry. The goal regex `^tests/?\s+export-ignore` rejects the anchored forms. The archive check `! grep -q 'tests/'` rejects `tests/**` (tested `10-alt`: both goals FAIL).
Fix (tested): attribute regexes `(?m)^/?tests(/|/\\*\\*)?\\s+export-ignore` (and the same for notes). Archive check: replace `! echo "$l" | grep -q 'tests/' && ! echo "$l" | grep -q 'notes/'` with `! echo "$l" | grep -q '/tests/.' && ! echo "$l" | grep -q '/notes/.'`.

**15.10-B (minor). An archive of `HEAD` passes while the tag lacks the attributes.**
Tested `10-wrong-head`: tag first, then commit the attributes, then archive `HEAD`. Result: ok, but `v2.0` would produce a different release.
Fix (tested together with A): read the attribute checks from `"source": "v2.0"` and not `HEAD`; label "export-ignore for tests/ and notes/ is in the tagged commit".

**15.10-C (minor).** "Anyone with the tag can regenerate a byte-identical archive." This is not true for `.tar.gz` across git versions: the gzip implementation changed in 2.38, which is what broke GitHub's archive checksums in 2023. Fix: "Anyone with the tag can regenerate an archive with exactly the same files."

## 15.11 Notes

Correct. The hard-coded path `ca9b8c4...` matches `@mark:c2` (verified). Tested passes: `main~1`/`main^` with `log --notes` and `push origin 'refs/notes/*'`, and `refs/notes/commits:refs/notes/commits`. Tested failures as they should: note on `HEAD`, and an amend afterwards.

**15.11-A (nit).** `git fetch origin refs/notes/*:refs/notes/*` is unquoted in an interactive shell, so the glob can expand. Quote it: `git fetch origin 'refs/notes/*:refs/notes/*'`.

## 15.12 Signed commits and tags

`minGit: "2.34"` and `tools: [ssh-keygen]` are right. The facts are right: amend makes a new unsigned object, and the tag keeps verifying. Tested passes: a key outside the repo with the private key as `signingkey`, `commit.gpgsign true` + `--amend --no-gpg-sign`, and `tag -s -m ... v1.0`. Tested failure as it should: commit not signed.

**15.12-A (major, sandbox). Without `-f`, `ssh-keygen` targets the learner's real `~/.ssh`.**
Verified: `HOME=<fake> ssh-keygen -t ed25519 -N ''` prompts `Enter file in which to save the key (/home/akash/.ssh/id_ed25519)`. OpenSSH uses the passwd home, not `$HOME`, so Canopy's private HOME does not protect here. Pressing Enter writes into the real folder, or offers to overwrite an existing real key.
Fix: step 1 becomes "Make a throwaway key inside this folder. Always pass `-f` with a path here: without it, `ssh-keygen` offers your real `~/.ssh/id_ed25519`, outside Canopy (answer `n`, or press Ctrl+C, if you ever see that prompt). `mkdir keys` then `ssh-keygen -t ed25519 -N '' -C canopy -f keys/canopy-key`." Keep `-f` in hint 1 (it already is).

**15.12-B (major). The private key can be committed.**
Tested `12-addall` (`git add -A` before the signed commit): the commit creates `keys/canopy-key`, `keys/canopy-key.pub` and `keys/allowed_signers`. Teaching people to commit a private key, even a throwaway one, is the wrong habit.
Fix (tested; the reference passes, and with the same solution only CHANGELOG is committed): `setup.sh` append `printf 'keys/\n' >> .git/info/exclude`. A different fix would put the keys in `../keys` as 15.18 does.

**15.12-C (minor). "Run `git verify-commit HEAD` again and read the result": there is no result to read.**
On an unsigned commit, `verify-commit` prints nothing and exits 1 (transcript). The prompt does not show exit codes.
Fix: step 6 becomes "Tamper: amend the commit without `-S` (keep the message). Run `git verify-commit HEAD; echo $?`: no output and a non-zero status. `git log -2 --format='%h %G? %s'` shows the difference too: `G` for a good signature, `N` for none."

**15.12-D (minor). "The tip was amended into an unsigned commit" passes at start.** `v1.0` does not exist yet and HEAD is unsigned.
Fix (tested; only this goal changed, and it no longer passes at start): put `{ "type": "tag", "name": "v1.0", "present": true }` first in its `checks`.

**15.12-E (nit).** Verification needs `ssh-keygen -Y find-principals` (OpenSSH 8.2+). The `tools` preflight only checks that the binary exists. Record this in the notes, or add "needs OpenSSH 8.2 or newer" to the intro.

## 15.13 The "ours" strategy

Accurate, and the fixture is well chosen: `-X ours` takes legacy's config (no conflicts), so it visibly differs (tested FAIL). Tested passes: `--strategy=ours --no-edit`, and `-X ours` → `reset --hard HEAD~1` → `-s ours`.

**15.13-A (nit). `-sours` is rejected.** Fix (tested): `"\\bgit merge\\b.*(-s ?|--strategy[= ])ours\\b"`.

## 15.14 Octopus merges

The four-parent goal, the extra `main` commit that keeps octopus from fast-forwarding, and the reference all work.

**15.14-A (major). The text says octopus refuses all conflict resolution; with the lesson's own command it does not.**
- Tested with `git merge header footer sidebar clash`: "Simple merge did not work, trying automatic merge ... Automatic merge failed; fix conflicts and then commit the result." The prompt shows `(main|MERGING)`. Resolving and committing gives five parents (`14-resolve5`), and then "four parents" and "clash is not merged" fail, with nothing in the text explaining why.
- Tested with `clash` first: "Automated merge did not work. Should not be doing an octopus. Merge with strategy octopus failed." There is no merge state, and `git merge --abort` gives `fatal: There is no merge to abort (MERGE_HEAD missing).`

git's rule: only the *last* branch may leave hand-resolvable conflicts; a conflict in an earlier one aborts.
Fix:
- intro: "... and it is meant for branches that do not conflict. The octopus strategy will not resolve conflicts between earlier branches: if one appears before the last branch, it refuses and leaves nothing to clean up. Only a conflict with the last branch stops like an ordinary merge, leaving markers to resolve."
- step 2: "Try all four at once: `git merge header footer sidebar clash`. `clash` comes last, so git stops with a conflict in `theme.css`, where `clash` and `header` edit the same line. Do not resolve it: abort the merge (the usual way). (Had `clash` come first, git would have refused outright with "Should not be doing an octopus", and there would be nothing to abort.)"
- What just happened: "The strategy is deliberately simple: it merges cleanly or gives up, letting only the last branch leave conflicts for you."
- question option 0: "Octopus does not resolve conflicts itself; clash and header changed the same line of theme.css, so the merge stopped". It stays correct in both orders.

## 15.15 Strategy options

Accurate: `R020` and modify/delete as described. `-X patience` and `-X histogram` alone still conflict, and `-X histogram` is accepted (tested). Tested passes: `-Xfind-renames=15` (no `%`), `rename-threshold=20%`, and `diff-algorithm=histogram` + `find-renames`. Tested failure as it should: resolving modify/delete by hand (usedCommand).

**15.15-A (minor). "The default merge strategy, `ort`" is only true from git 2.34.** Canopy's minimum is 2.32, where the default is `recursive`. The lesson works on both.
Fix: "The default merge strategy (`ort` since git 2.34, `recursive` before) takes options with `-X`."

## 15.16 Maintenance

Behaviour verified: the first loose-objects run packs 91 and keeps 91 loose (`prune-packable: 91`), and the second leaves 0. commit-graph writes `commit-graphs/`.

**15.16-A (minor). The object count is 91, not 90** (`count-objects -v`: `count: 91`; the README blob is the extra one). Fix: "90" → "91" in steps 1 and 3 ("still 91 loose, and now 91 in a pack").

**15.16-B (minor). No way back if a learner runs `maintenance start` anyway.** It edits the real crontab or systemd user timers, and the guard goal then stays failed.
Fix: after the `start` paragraph add "If you ever run it by accident, `git maintenance stop` removes the scheduled job again." Also give the guard `"exitCode": null`, so a failed attempt counts too.

**15.16-C (nit).** "(cron, launchd or the Windows scheduler)": on Linux, git 2.34+ prefers systemd timers. Fix: "(cron or systemd timers, launchd, or the Windows scheduler)".

**15.16-D (nit).** `minGit: "2.29"`. As far as I can tell, 2.29 shipped only the `gc` and `commit-graph` tasks, and `loose-objects`, `incremental-repack`, `prefetch` and `start` arrived in 2.30. The release notes I could fetch are not specific. This does not matter in practice because Canopy requires 2.32, but `"2.30"` is the safer value, and the LESSONS.md table could say so.

## 15.17 Which commits are equivalent

Correct: `cherry -v` gives `- - +`, `feature~2` and `feature-v2~2` share patch id `c35b0f6...`, and the tips differ (transcript). The `range-diff` reference respects the recall rule.

**15.17-A (nit).** "`git cherry` is how git itself decides which commits to skip during a rebase". Rebase uses the same patch-id comparison (`rev-list --cherry-pick`), not `git cherry` itself. Fix: "The same patch-id comparison is how git decides which commits to skip during a rebase or `pull --rebase` when upstream already has them."

## 15.18 Boss: ship a vendored, signed release

The key is pre-generated in `../keys` by setup (good: no learner `ssh-keygen`, no real `~/.ssh`). `tools` and `minGit` are right. Tested passes: named remote without `--squash`, `format-patch -3 search`, private key as `signingkey`, archive of `main`, and `bundle --all`. Tested failures as they should: submodule instead of subtree, unsigned annotated tag, and `-4` patches.

**15.18-A (minor). The goal "verifies with the release key" accepts any key.**
Tested `18-ownkey`: a new key of the learner's, with their own allowed-signers file, gives ok on the live tree.
Fix (tested; the reference and `18-alt` pass, and own-key FAILs): third sub-check script
`fp=$(ssh-keygen -lf "$LESSON_ROOT/keys/release-key.pub" | cut -d' ' -f2); git verify-tag v2.0 2>&1 | grep -qF "$fp"`

**15.18-B (nit).** The archive check `! grep -q 'tests/'` has the same `tests/**` issue as 15.10-A. Setup writes the attribute, so it only matters if a learner rewrites it. Optional: `! grep -q '/tests/.'`.

---

## Alternative-approach tests

"Live" is the current tree; "Fixed" is the scratch copy with the tested fixes. Blank = not rerun.

| File | Approach | Live | Fixed | Correct? |
|---|---|---|---|---|
| 01-abs | absolute submodule URL, `add -A` | ok | ok | yes |
| 01-twocommits | `.gitmodules` and gitlink in two commits | FAIL | ok | no on live, 15.01-A |
| 01-wrong-embedded | plain clone + `git add lib` | FAIL | FAIL | yes |
| 02-clonework | `init`+`update`; fresh cloned from work | ok | | yes |
| 02-wrong-remote | `update --init --remote` (gets 1.1) | FAIL | | yes |
| 03-detachedpush | commit detached, `push origin HEAD:main` | ok | ok | yes |
| 03-remote | separate lib clone + `update --remote` | ok | ok | yes |
| 03-wrong-nopushlib | library never published | FAIL | FAIL | yes |
| 04-force | `deinit -f --`, `rm -f` | ok | ok | yes |
| 04-rmfirst | `git rm` before deinit, manual config removal | FAIL (deinit exit 1) | | acceptable, 15.04-B |
| 05-nosquash-remote | named remote, no `--squash` | ok | ok | yes |
| 05-actionfirst-split | action twice first, `split -b` + push | ok | ok | yes |
| 05-wrong-copy | hand-copied vendor folder | ok | FAIL | no on live, 15.05-A |
| 06-subtreesfirst | subtrees first (one unsquashed), then submodule | ok | ok | yes |
| 06-wrong-copy | utils/fonts extracted by hand | ok | FAIL | no on live, 15.06-A |
| 06-submodule-uncommitted | subtree add with submodule staged | refused by git | | 15.06-B |
| 07-n3 | `-3 -o` on feature; `--check --stat` | ok | | yes |
| 07-feature-only | `--output-directory`, explicit file list | ok | | yes |
| 07-wrong-cover | `--cover-letter` | FAIL | | acceptable, 15.07-B |
| 08-plain-abort | plain am, abort, `-3`, `checkout --theirs` | ok | | yes |
| 08-plain-manual | plain am, fix each patch by hand | ok | | yes |
| 08-wrong-skip | `am --skip` the conflict | FAIL | | yes |
| 09-fetchmerge | `main~1..main`, fetch + merge FETCH_HEAD | ok | ok | yes |
| 09-caret | `main ^v1.0` | FAIL | ok | no on live, 15.09-C |
| 09-wrong-direct | clone/pull from project, not bundle | ok | FAIL | no on live, 15.09-A |
| 10-alt | `/tests`, `/notes/**`, archive in lesson folder | FAIL | ok | no on live, 15.10-A |
| 10-wrong-head | tag before attributes, archive HEAD | ok | FAIL | no on live, 15.10-B |
| 11-alt | `main~1`, `main^`, `push origin 'refs/notes/*'` | ok | | yes |
| 11-pushcolon | `refs/notes/commits:refs/notes/commits` | ok | | yes |
| 11-wrong-head | note on HEAD | FAIL | | yes |
| 11-wrong-amend | amend after noting | FAIL | | yes |
| 12-outside | key in `..`, private key, `commit.gpgsign` | ok | ok | yes |
| 12-addall | `git add -A` commits the private key | ok (key committed) | ok (key excluded) | 15.12-B |
| 12-wrong-unsignedcommit | commit not signed | FAIL | | yes |
| 13-long | `--strategy=ours --no-edit` | ok | ok | yes |
| 13-sours | `-sours` | FAIL | ok | no on live, 15.13-A |
| 13-wrong-X | `-X ours` | FAIL | FAIL | yes |
| 13-wrong-X-then-s | `-X ours`, reset, `-s ours` | ok | | yes |
| 14-clashfirst | clash first: refusal, abort fails, then three | ok | | yes (text wrong, 15.14-A) |
| 14-resolve5 | resolve the last-branch conflict, commit | FAIL (5 parents) | | expected, but 15.14-A |
| 15-alt | `-M1%`, `-Xfind-renames=15` | ok | | yes |
| 15-renthresh | `rename-threshold=20%` | ok | | yes |
| 15-patience | patience, histogram fail; `diff-algorithm` + find-renames | ok | | yes |
| 15-wrong-manual | resolve modify/delete by hand | FAIL | | yes |
| 18-alt | named remote, `-3 search`, private key, archive main, `--all` | ok | ok | yes |
| 18-ownkey | learner's own key instead of release key | ok | FAIL | no on live, 15.18-A |
| 18-wrong-submodule | submodule instead of subtree | FAIL | | yes |
| 18-wrong-unsignedtag | `tag -a` | FAIL | | yes |
| 18-wrong-patches-after-vendor | `-4` patches | FAIL | | yes |

Goals passing at start (live): 15.03 (2 + clean), 15.04, 15.12 (tamper) are fixed above. The rest are invariants (clean tree, refs unchanged, "start not run") and are fine.

## Applied

All 6 majors, all minors except X-1 and 15.08-A (app; resolved by the lead: per-attempt global config and an `am` operation/`|AM` prompt), and the nits 15.04-B, 15.05-B, 15.06-C, 15.07-A/B, 15.08-B, 15.11-A, 15.12-E, 15.13-A, 15.16-C, 15.17-A, 15.18-B. Skipped: 15.16-D (`minGit` left at "2.29"; 2.30 could not be confirmed). 15.08 now uses `operation: null` (covers `am`). Live tree: `validate` 0 errors, `test 15` 18 ok; every yaml in the table re-run with the results in the "Fixed" column (07-wrong-cover now passes, as intended).
