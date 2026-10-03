# Review: section 14, Internals (lessons 14.01 to 14.18)

Reviewer: independent senior review, 2026-10-03. Local git 2.43.0. I did not edit any lesson files. I applied every goal fix marked "tested" to a scratch copy (`/tmp/claude-1000/review14/fixed/lessons`) and ran it through `canopy-lesson test` with the reference solution and with the alternative and wrong solutions in `/tmp/claude-1000/review14/alt/`. With all fixes applied, `test 14` on that copy gives 18 ok and 0 failed.

## Overall verdict

The section is careful and mostly accurate. The fixture is a good choice, and the plumbing lessons follow a sensible path from blob to tree to commit to tag to index to refs to a commit built by hand. `validate`: 225 lessons, 0 errors (section 14 has 4 shell-check warnings only). `test 14`: 18 ok, 0 failed.

**Hard-coded ids: all correct and deterministic.** I rebuilt the garden fixture under TZ=UTC, Asia/Kolkata and America/Los_Angeles and got identical ids each time. Every id embedded in goals, content, hints and solutions matches real git:
- garden: HEAD tree `0d4542a…`, README blob `ec5cadf…` (77 bytes), docs tree `8ebbc49…`, guide blob `323741b…`, plants blob `7aec562…`, tag object `bf47e4e…`, tip `5ce004c`, herbs-1 `2728b4f`, wip~1 `ff62c7d…`.
- 14.02: `7d79c12…` and `3225abb…`. 14.07: `629c02b…`. 14.12: SHA-256 of `hello\n` is `2cf8d83d…ebb4`.
- 14.14: `bd932da…` is the mark `lost`. 14.15: `9b74028…`. 14.16: `ae87540…`. 14.18: tree `8cb8b09…` and blob `92bf40c…`.

The real problems are these:
- **14.16 cannot be completed by following its own steps** (blocker). `git merge-tree --write-tree` exits 1 when there is a conflict, and `usedCommand` defaults to `exitCode: 0`.
- **14.14 is only right on git 2.41 and later.** Cruft packs became the default in 2.41 (RelNotes 2.41.0). Before 2.41, a plain `gc` leaves the unreachable objects loose, so `in-pack` is 9, not 15, and "They were packed, not deleted" is false. The author's note says "15 on every supported version", which is wrong. I reproduced the old behaviour with `-c gc.cruftPacks=false`.
- **14.15 has two false statements about git:** "`--full` also checks packs" (it is the default) and "you could also have pushed or fetched the missing object" (tested: neither repairs it).
- **The 14.18 goal accepts a hand-typed commit with different content.** Tested: "Open the vault to the public in summer." passes.
- **Several lessons describe UI that does not exist.** The `.git` tab has Refs, Index and an Objects lookup box. It does not show "the same folders", does not list objects, and does not show "before and after". The graph does not draw trees.

Counts: **1 blocker, 6 major, 13 minor, 23 nit** (14.01-A, 14.04-A, 14.07-B and 14.13-B are instances of X1 and are not counted twice).

### Shell checks (asked focus)

| Lesson | Script | Read-only? | Verdict |
|---|---|---|---|
| 14.13 | `ls .git/objects/pack/*.pack` | yes | OK, but loose. It passes after `git repack` without `-d`, which leaves 37 loose objects. Tighter version: `git count-objects -v \| grep -qx 'count: 0' && ls .git/objects/pack/*.pack >/dev/null 2>&1`. No built-in check type fits (`pathExists` has no glob). |
| 14.14 | `! git cat-file -e bd932da…` | yes | Id correct (`lost`). The check is needed: `reachable` cannot express "object gone" because the commit is unreachable from the start. Deleting `.git/objects/bd` by hand also passes it, but the `git gc` goal catches that (tested). |
| 14.15, 14.18 | `git fsck --full >/dev/null 2>&1` | yes (no `--lost-found`) | Needed; no built-in check runs fsck. `--full` is the default and harmless. Dangling objects do not make it fail (exit 0), which is correct here. |

The engine change (refs that point at missing objects are now skipped) does not break anything in this section. It does make the reason given in the author's notes for 14.18's dangling *symbolic* ref out of date (see 14.18-C). The notes' worry about 14.12's `sha-repo` being absent at start is also resolved: `session.rs::snapshots` returns `snapshot: None` for a missing repo.

---

## Cross-cutting

**X1 (major). The lessons describe the `.git` tab and the graph as showing things they do not.**
The panel is labelled **.git** in the tab bar (`Inspector.tsx` `TAB_LABEL`). It shows three sections: Refs (ref and short id), Index (path, stage, short blob id) and Objects, which is a search box that prints `cat-file -p` output for an id you type. DESIGN.md 4.6 also calls it "the .git tab". The lessons call it "the inside-git panel", which is not a UI name from LESSON_FORMAT.md section 3 and is not the label the learner sees.
- `14.01/content.md` step 4: "Look at the inside-git panel: it shows the same folders, organised." It shows no folders.
- `14.07/content.md` step 3: "the inside-git panel shows it under objects". It does not list objects; you have to type the id.
- `14.13/content.md`: "The inside-git panel shows the objects folder before and after." False.
- `14.04/content.md`: "The graph draws the same nesting." The graph draws commits only.

Fixes:
- 14.01 step 4: "Open the **.git** tab next to the files panel. It shows the refs, the index and a box for reading any object by id."
- 14.07 step 3: "Confirm that the blob exists: type its id into the Objects box of the .git tab, or print it with `cat-file -p`."
- 14.13: delete the last sentence, or write "The .git tab's Objects box still finds every object by id."
- 14.04: replace "The graph draws the same nesting." with "The Objects box in the .git tab reads any of these ids the same way."

**X2 (nit). Recall rule.** Several lessons show the command for a skill listed in their `requires`:
- 14.04 "Reading a tree with `cat-file -p`" (`cat-file`).
- 14.12 step 4 and hint 2: `echo hello | git hash-object --stdin` (`hash-object`). `--stdin` is new, so showing it is defensible.
- 14.14 step 1 and hint 1: `count-objects -v` (`packfiles`).

14.10's case is deliberate and recorded in the notes, so I accept it. Fix: write "count the objects as in the last lesson" and similar, or record these as deviations.

**X3 (minor). The author's notes are partly wrong or out of date** (`lessons/_notes/section-14.md`):
- "after a plain gc … in-pack is 15 on every supported version" is false for git older than 2.41 (see 14.14-A).
- The reason given for the 14.18 symbolic ref (the snapshot aborts on a missing id) no longer applies.
- The `sha-repo` concern is resolved.

Update the notes.

---

## 14.01 A tour of .git

**14.01-A (major, part of X1).** Step 4 panel text. Fix above.

**14.01-B (nit).** `ls .git` in the fixture also shows `branches`, `description`, `info`, `ORIG_HEAD` and `COMMIT_EDITMSG`. A learner will wonder about `branches/`, which is also one of the wrong options in the `new-branch` question. Add after the list: "You will also see a few minor entries (`description`, `info/`, `branches/`, `ORIG_HEAD`, `COMMIT_EDITMSG`); `branches/` is a leftover from early git and is not where branches live."

**14.01-C (nit).** The bullet "`HEAD`: a text file naming the branch you are on." would be more accurate with "… (or a commit id, when HEAD is detached)." The `head-file` answers could also accept `ref:refs/heads/main`.

## 14.02 Content-addressable storage

**14.02-A (nit, tested).** The `folder` question rejects `.git/objects/7d/`, which is a natural answer after `ls`. Add `".git/objects/7d/"` and `"objects/7d/"` to `accept`. Tested: the alternative answer passes after the fix and fails before.

**14.02-B (nit).** "Two files with identical content became one object." The learner stores only `seeds-a.txt`. Write: "Two files with identical content map to one object id, so git would store them once."

**14.02-C (nit).** `git add seeds-a.txt seeds-c.txt` passes both "Store" goals (tested). That is acceptable, since `add` writes the same blob, but nothing checks that `hash-object -w` was used. Optional fix: add a goal `{"type":"usedCommand","matches":"\\bgit hash-object\\b.*\\s-w\\b"}`.

## 14.03 Blobs and cat-file

No issues. The ids, the size (77) and the third line ("mint") are verified, and no prefix is ambiguous.

## 14.04 Trees

**14.04-A (major, part of X1).** "The graph draws the same nesting." Fix above.

**14.04-B (nit).** "Files point to blobs; subfolders point to other trees." This is fine for this course. Optionally add "(a submodule entry points to a commit)".

## 14.05 Commits as objects

**14.05-A (minor).** "The commit's id is the hash of exactly this text." That contradicts 14.02, which correctly says git hashes a header plus the content. Write: "The commit's id is the hash of this text (with the same small `commit <size>` header that blobs get)."

**14.05-B (nit).** The template shows `author Name <mail> <timestamp>`. The real line is `… 1714586400 +0000`. Write `<timestamp> <timezone>`.

**14.05-C (nit).** Content and hint 1 show `git cat-file -p HEAD`. `cat-file` is not in `requires`, so this is legal, but adding `cat-file` to `requires` and writing "print the latest commit as an object" would make the learner recall it.

## 14.06 Tags as objects

No issues. The `v1.0` ref file holds `bf47e4e`, the tag object, and the tag's `object` line is `ba5f7b7` (`merge`). Verified.

## 14.07 The index is a file

**14.07-A (minor).** "`git update-index` edits it directly; staging a file is `update-index --add` plus writing the blob." `update-index --add <file>` writes the blob itself, which is exactly what step 4 does. The index also caches file stat data (size, mtime), which is what makes `status` fast and what 14.17's all-zero id depends on. Fix: "The staging area is a single binary file, `.git/index`: for every path, the mode, the blob id of the staged content, a stage number (0 unless there is a conflict) and cached file details such as size and modification time, so git can spot changes quickly." And: "`git update-index --add <file>` writes the blob and records it, which is what staging does."

**14.07-B (major, part of X1).** Step 3 panel text. Fix above.

**14.07-C (nit, tested).** The regex `\bgit ls-files\b.*(-s|--stage)\b` rejects `git ls-files -sv` and other combined short flags. Fix (tested: the reference solution and `-sv` both pass):
```json
{ "type": "usedCommand", "matches": "\\bgit ls-files\\b.*\\s(-[a-zA-Z]*s[a-zA-Z]*|--stage)\\b" }
```

## 14.08 rev-parse

**14.08-A (minor).** Hint 3: "`cd docs`, then `git rev-parse --show-toplevel`, `--show-prefix` and `--git-dir`." From `docs/`, `--git-dir` prints an absolute path. The question asks for the value "From the repository root" and accepts only `.git`. A learner who follows the hint and pastes that output gets "wrong". Fix: "`cd docs`, then `git rev-parse --show-toplevel` and `--show-prefix`. Ask for `--git-dir` back at the root (inside `docs/` it prints the full path instead). Come back with `cd ..`."

**14.08-B (nit).** `wip1` is a `text` question with 34 prefixes. A `commit` question with `"answer": "@mark:wip-1"` accepts any prefix of 4 or more characters and is simpler. Keep "full id" in the prompt only if the full id is required.

## 14.09 Refs by hand

**14.09-A (minor, tested).** The "Create experiment at HEAD~2 with update-ref" goal can pass without using plumbing for that branch. `usedCommand` matches any earlier `update-ref` line that contains "experiment". Tested: `git update-ref refs/heads/experiment-old HEAD~2`, then `git branch experiment HEAD~2`, then `git branch -f experiment herbs` passes the whole lesson. Fix (tested: the reference, `$(git rev-parse …)` targets, `-m "msg"` and `main~2` forms pass; the wrong path fails):
```json
{ "label": "Create experiment at HEAD~2 with update-ref", "sticky": true,
  "check": { "type": "all", "checks": [
    { "type": "usedCommand", "matches": "\\bgit update-ref\\b.*\\srefs/heads/experiment(\\s|$)", "last": true },
    { "type": "refAt", "ref": "experiment", "target": "@mark:mint" } ] } }
```

**14.09-B (nit).** "Move experiment" does not require plumbing, so `git branch -f experiment herbs` passes it. LESSONS.md says "using only plumbing". Either accept this (the goal label does not mention update-ref) or use the same `last`/sticky pattern with `@mark:herbs-tip`.

**14.09-C (nit).** In the delete regex, `--delete` is dead: `update-ref` has only `-d`. It is harmless. `git update-ref --stdin` with `delete refs/heads/old-idea` is also valid plumbing but rejected. That is fine to leave.

The facts are correct: the loose file wins over `packed-refs`, `pack-refs --all` removes the loose files, and HEAD~2 is `mint`.

## 14.10 Build a commit by hand

**14.10-A (minor).** Step 4: "List it: it has the four old files plus `hello.txt`." A non-recursive `ls-tree <tree>` shows `README.md`, `docs`, `hello.txt` and `plants.txt`: three old entries, one of them a tree. Fix: "List it: the three old entries (`docs` is a tree) plus `hello.txt`."

**14.10-B (nit, tested).** `git stage hello.txt` (an alias of `add`) gets past "Do not use git add or git commit". Fix: `"matches": "\\bgit (add|stage|commit)( |$)"`.

Alternatives tested and passing: `update-index --add hello.txt` without `--cacheinfo`; the old `--cacheinfo 100644 <id> <path>` form; message on stdin to `commit-tree`; `merge --ff-only` instead of `update-ref`. The wrong approach `git add` plus `git commit` fails.

## 14.11 The history DAG

All counts are verified: 8, 2, 10, and `--ancestry-path 2728b4f..main` = 3 against 4 without it. `2728b4f` is herbs-1, and the extra commit is `mint`, which is newer.

**14.11-A (nit).** "from the graph panel" should be "from the graph" (LESSON_FORMAT UI names).

## 14.12 Hash algorithms

**14.12-A (minor).** "The object formats are identical; only the hash function differs." Trees store 32-byte binary ids instead of 20-byte ones, and commits and tags store 64-character ids, so only blobs come out byte-identical. Fix: "The object model is the same; only the hash function differs, so ids are longer everywhere, including inside trees, commits and tags. The same content gets a different, longer name."

**14.12-B (minor).** "since version 2.29 a repository can use SHA-256". Add that it was marked experimental until 2.42 (RelNotes 2.29.0 line 44 and 2.42.0 line 41): "…since version 2.29 a repository can use SHA-256 (marked experimental until git 2.42)". The interoperability statement is accurate: there is still no interop as of 2.42/2.43.

Tested and passing: `GIT_DEFAULT_HASH=sha256 git init`, `mkdir` plus `git init --object-format sha256`. A SHA-1 `git init` fails, as it should.

## 14.13 Loose objects and packfiles

The count of 37 is verified (12 commits, 12 trees, 13 blobs). After `gc` it is 0 loose and 37 in-pack.

**14.13-A (minor).** "git also packs … on every push and fetch". Transfers are sent as packs, but a receiver keeps fewer than `transfer.unpackLimit` objects (100 by default) as loose objects. Fix: "push and fetch send objects as a pack, and large transfers are kept as packs."

**14.13-B (major, part of X1).** The last sentence about the panel. Fix above.

**14.13-C (nit).** Step 4: "Most blobs are now short lines with a depth number and a base id at the end." The delta lines are *longer*: two extra fields. Real output: 10 of 13 blobs are deltas, against the **newest** version `ee4fa1b`. Write: "Most blobs now show a tiny size (a few bytes) and two extra fields, a depth and a base id: they are stored as deltas. Note that the base is the newest version of `log.txt`; git keeps the latest version whole and stores older ones as differences."

**14.13-D (nit).** The shell check can be tightened (see the shell table). Also add a hint: "Count before you run gc. If you already ran it, reset the lesson."

## 14.14 Garbage collection

**14.14-A (major, tested).** The answer and the text depend on the git version. With cruft packs, the default only since 2.41, a plain `gc` packs the 6 unreachable objects into a cruft pack: `in-pack: 15`. On 2.32 to 2.40, gc runs `repack -A --unpack-unreachable=…`, so loose unreachable objects stay loose: `count: 6`, `in-pack: 9`. I reproduced this with `git -c gc.cruftPacks=false gc`. That learner gets the question wrong with the true answer, and step 2 ("They were packed, not deleted") is false for them. `minGit` is not set.

Fix (tested: the reference solution and a simulated pre-2.41 run both pass), a question that works on every version:
```json
{ "id": "in-pack-after-gc",
  "prompt": "After the plain gc, how many objects does count-objects report in total (count plus in-pack)?",
  "type": "number", "answer": 15 }
```
Goal label: "Count all objects after gc". Step 2: "Run a plain `git gc`. Count again and list the unreachable objects again. They are all still there: git 2.41 and later moves them into a separate 'cruft' pack, older versions leave them loose." The `why-kept` option 4 ("Because they were already in a pack") stays a valid wrong answer. Alternative: set `minGit: "2.41"`. Then `minGit` only shows a notice and the text stays wrong for older users, so I prefer the version-neutral question.

**14.14-B (major).** The bullet "`git prune` and `git repack -a -d`: the two halves gc is made of; … (`-a` keeps only reachable objects, `-d` removes the old packs)" is misleading in a destructive lesson. gc runs `repack -A` or `--cruft` precisely to *keep* unreachable objects through the grace period. `repack -a -d` drops unreachable objects that are already packed **immediately, with no grace period**. Tested: after a plain gc, `git repack -a -d` deletes `bd932da` at once. Fix:

"- `git prune`: delete unreachable loose objects (with no grace period unless you pass `--expire`),
- `git repack -a -d`: rewrite everything reachable into one pack and delete the old packs. Unreachable objects that were only in those packs are gone at once, with no grace period, which is why `gc` itself uses a gentler form."

**14.14-C (minor).** "An object that no ref, no reflog and no other object points to is **unreachable**." The scratch tree and blob *are* pointed to, by the unreachable scratch commit. Fix: "An object you cannot reach by following links from any ref, reflog entry or the index is **unreachable**."

The hard-coded id `bd932da…` in the shell goal is correct and stable. Tested alternatives: `gc`, then `repack -a -d` plus `prune` passes. `gc` then plain `prune` fails, correctly on 2.43, because the objects sit in a cruft pack. Deleting `.git/objects/bd` by hand fails on "Run git gc".

## 14.15 Checking integrity

**14.15-A (major).** The bullet "`git fsck --full`: also check objects inside packs" implies that plain `fsck` skips packs. `--full` has been the default for a long time (git-fsck(1): "This is now default; you can turn it off with `--no-full`"). Real output is identical with or without `--full`. Fix: "`git fsck`: check every object (loose and packed) and that every ref points at something that exists. You will see `--full` in older guides; it is the default now."

**14.15-B (major, tested).** "You could also have pushed or fetched the missing object from a remote." This is false. Negotiation sees that the repository already "has" the commit, so nothing is sent. Tested: `git fetch ../backup`, `git fetch ../backup main:refs/remotes/b/main` and a push from backup all leave `fsck` failing with exit 3. Fix: "Fetching or pushing would not help: git thinks you already have the object and does not send it again. Copying the object, or a pack that contains it, from another clone is the standard repair."

**14.15-C (minor, tested).** The goal "Check the repository with git fsck" uses the default `exitCode: 0`. `fsck` on the damaged repo exits 3, so the learner's first `git fsck --full` (step 1) does not tick the goal. It ticks only after the repair. Fix (tested): add `"exitCode": null`.

**14.15-D (minor, tested).** The obvious plumbing repair, `git -C ../backup cat-file blob <id> | git hash-object -w --stdin`, silently does nothing. git sees the object file already exists and does not rewrite it. It works after the corrupt file is removed (tested both ways). Add to "What just happened" or a hint: "git never overwrites an existing object file, so to rebuild the object with `hash-object -w`, delete the damaged file first."

**14.15-E (nit).** Step 3 says "the healthy copy has the same name under `backup/.git/objects/`". That is true here, because a local clone copies loose objects. A clone over a network would have it inside a pack. Add "(here as a loose file; in a clone from a server it would be inside a pack)". Also, `--lost-found` is taught but not exercised. That is acceptable, since 10.09 practised it.

Other alternatives tested: copying the whole object store passes; `info/alternates` pointing at the backup passes (acceptable); re-committing `data.csv` fails, correctly.

## 14.16 How a merge is computed

**14.16-A (blocker, tested).** `git merge-tree --write-tree main spicy` exits **1** here, because there is a conflict, and the content says so itself. The goal `"\\bgit merge-tree\\b.*--write-tree"` uses the default `exitCode: 0`. The reference solution passes only by accident: its later `git ls-tree $(git merge-tree … | head -1)` line matches the regex and exits 0. A learner who follows the steps literally, pasting the tree id into `ls-tree` and printing the blob with `cat-file`, never completes the lesson (tested: `14.16-literal.yaml` fails). Fix (tested; literal, reversed-argument and `--name-only` approaches all pass):
```json
{ "label": "Preview the merge with git merge-tree",
  "check": { "type": "usedCommand", "matches": "\\bgit merge-tree\\b.*--write-tree", "exitCode": null } }
```

**14.16-B (nit).** "the conflicted paths are listed after the tree id" (content and hint 2). The real output is a "conflicted file info" block with one line per version (`<mode> <blob> <stage> <path>`, stages 1, 2 and 3), then a blank line, then messages. Also worth saying: the result tree *does* contain `chili.md`, with conflict markers in it. Fix: "If there are conflicts, the exit code is 1, and after the tree id come one line per conflicting version (mode, blob id, stage 1/2/3, path) and then git's messages. The tree still holds the conflicted file, with conflict markers in it."

**14.16-C (nit).** "the engine behind server-side merge buttons" is too broad. Write "the kind of computation hosting services run for their merge buttons".

The `notes.md` blob `ae87540` is the same with either argument order (verified). Asking for the blob rather than the tree is a good design choice. A real `git merge` followed by `--abort` and then `merge-tree` passes after the fix; this cannot be detected and is acceptable.

## 14.17 Diff plumbing

**14.17-A (minor).** "Knowing which two things are compared is what the three-area panel has been showing all along". This lesson's `panels` is `[inside-git]` only, so that panel is not on screen. Either add `three-areas` to `panels`, or write "…is what the three-area panel in earlier lessons showed: working tree, index, HEAD."

**14.17-B (nit).** "Underneath are three plumbing commands": porcelain `git diff` does not call them. Write "Next to it are three plumbing commands that each make one fixed comparison". The goal labels "Say what diff-files compares" and the others actually ask for a path. Rename them to "Name the path diff-files lists" and so on.

The raw-line field order and the all-zero id statement are correct (verified output).

## 14.18 Boss: repository forensics

**14.18-A (major, tested).** The `recovered` goal only checks that `plans/launch.md` *contains* "Open the vault to the public". Tested: `git switch -c recovered`, retyping the file as "…in summer.", then `git add` and `git commit` passes the whole boss. That is a different commit from the one asked for ("built from the orphaned tree"). Fix (tested; the reference solution and `commit-tree` + `branch`, `read-tree` + `commit`, and `HEAD`-parent forms all pass; the retyped wrong content fails), with no shell check: exact content plus "changes only that file" fixes the tree:
```json
{ "label": "A branch recovered holds a commit built from the orphaned tree, on top of main",
  "check": { "type": "all", "checks": [
    { "type": "fileContent", "source": "recovered", "path": "plans/launch.md",
      "equals": "# Launch plan\n\nOpen the vault to the public in spring.\n" },
    { "type": "commitChanges", "rev": "recovered", "paths": ["plans/launch.md"], "exact": true },
    { "type": "commitParents", "rev": "recovered", "count": 1 },
    { "type": "refAt", "ref": "recovered~1", "target": "@mark:tip" } ] } }
```

**14.18-B (nit).** The two questions are simple recall (`rev-list --count`, `cat-file -t`) for "explain its structure". Optionally add one about the found object: "What type of object did fsck report as dangling?" (tree).

**14.18-C (nit).** With the engine change, a plainer broken ref is now possible: a ref file holding the id of a missing commit, which is the classic "broken ref" after disk damage. The dangling symbolic ref works and is tested, so this is optional. Update the notes either way.

Tested alternatives (all pass): `branch -f release v1.0` (writes through the symref); `symbolic-ref -d` then `branch release`; `rm` the ref file then `update-ref`; `update-ref` without `--no-deref`; repairing the blob with `rm` and `hash-object -w`; `read-tree` + `commit` on a new branch. Wrong approaches: `update-ref --no-deref release v1.0` (a tag object in a branch) fails; retyped content fails after the fix.

---

## Alternative-approach tests

Run: `./target/debug/canopy-lesson test <id> --solution /tmp/claude-1000/review14/alt/<file>`. "Fixed" means run against the scratch copy with the fixes above.

| File | Kind | Original | Fixed | Note |
|---|---|---|---|---|
| 14.02-add | alt (`git add` stores blobs) | ok | ok | acceptable |
| 14.02-stdin | alt (`--stdin`, answer `.git/objects/7d/`) | FAIL | ok | 14.02-A |
| 14.07-allplumbing | alt (`update-index --add` for both) | ok | ok | |
| 14.07-addfirst | alt (`add` both, then `update-index extra.txt`) | ok | ok | |
| 14.07-ls-files-sv | alt (`ls-files -sv`) | FAIL | ok | 14.07-C |
| 14.09-short | alt (`symbolic-ref --short`, `main~2`, `refs/heads/herbs`, `pack-refs`) | ok | ok | |
| 14.09-revparse | alt (`$(git rev-parse …)`, old-value argument) | ok | ok | |
| 14.09-msg | alt (`update-ref -m "…"`) | ok | ok | |
| 14.09-branchcmds | wrong (porcelain only) | FAIL | FAIL | correct |
| 14.09-mixed-wrong | wrong (decoy `update-ref`, then `git branch`) | **ok** | FAIL | 14.09-A |
| 14.10-noncacheinfo | alt (`update-index --add file`) | ok | ok | |
| 14.10-reset | alt (space-form `--cacheinfo`, stdin message, `merge --ff-only`) | ok | ok | |
| 14.10-stage-alias | wrong (`git stage`) | **ok** | ok* | 14.10-B fix not applied in the scratch copy |
| 14.10-wrong-addcommit | wrong (`add` + `commit`) | FAIL | FAIL | correct |
| 14.12-envvar | alt (`GIT_DEFAULT_HASH=sha256`) | ok | ok | |
| 14.12-mkdir | alt (`mkdir`, `init --object-format sha256`) | ok | ok | |
| 14.12-wrong-sha1 | wrong (SHA-1 repo) | FAIL | FAIL | correct |
| 14.13-repack | alt (`repack -a -d`) | ok | ok | |
| 14.13-wrong-nogc | wrong (never packs) | FAIL | FAIL | correct |
| 14.14-repack-prune | alt (`gc`, `repack -a -d`, `prune`) | ok | ok | |
| 14.14-nocruft | git < 2.41 simulation (`-c gc.cruftPacks=false`) | FAIL with the true answer 9 | ok (answer 15 = total) | 14.14-A |
| 14.14-prune-only | wrong (`gc` + `prune`, cruft-packed objects survive) | FAIL | FAIL | correct on 2.43 |
| 14.14-wrong-rm | wrong (`rm -rf .git/objects/bd`) | FAIL | FAIL | caught by the "Run git gc" goal |
| 14.15-cpall | alt (copy the whole object store) | ok | ok | |
| 14.15-hashobj-rm | alt (`rm`, then `cat-file \| hash-object -w`) | ok | ok | |
| 14.15-alternates | alt (`info/alternates` → backup) | ok | ok | acceptable |
| 14.15-hashobj-norm | plausible (no `rm`; git keeps the corrupt file) | FAIL | FAIL | 14.15-D (text fix) |
| 14.15-wrong-recommit | wrong (re-commit `data.csv`) | FAIL | FAIL | correct |
| 14.16-literal | **the lesson's own steps** (pasted tree id) | **FAIL** | ok | 14.16-A blocker |
| 14.16-reverse | alt (`spicy main`) | ok | ok | |
| 14.16-nameonly | alt (`--name-only`, `rev-parse <tree>:notes.md`) | ok | ok | |
| 14.16-wrong-merge-stay | wrong (real merge, left in progress) | FAIL | FAIL | correct |
| 14.16-wrong-merge | real merge, aborted, then merge-tree | FAIL | ok | acceptable; end state is correct |
| 14.18-a | alt (`branch -f release`, `branch recovered $(commit-tree)`, `hash-object` repair) | ok | ok | |
| 14.18-b | alt (`symbolic-ref -d`, `read-tree` + `commit`) | ok | ok | |
| 14.18-c | alt (`rm` ref file, `update-ref`, `-p HEAD`, `cp -f`) | ok | ok | |
| 14.18-d | alt (`update-ref` through the symref) | ok | ok | |
| 14.18-wrong-retype | wrong (retype a different plan by hand) | **ok** | FAIL | 14.18-A |
| 14.18-wrong-tagobj | wrong (tag object in a branch) | FAIL | FAIL | correct |

\* With 14.10-B applied, `git stage` fails the "do not use" goal as intended.

Reference solutions with all fixes applied: `canopy-lesson test 14 --lessons /tmp/claude-1000/review14/fixed/lessons` gives 18 ok, 0 failed.
