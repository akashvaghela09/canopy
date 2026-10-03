# Notes: section 14, Internals (lesson author)

All 18 lessons pass `canopy-lesson test 14`. Every lesson sets `panels: [inside-git]`.

## Fixtures

- `_lib/fixtures/s14-garden.sh`: the "garden log" repo used by 14.01 to 14.12 (8 commits on main including
  one merge, branches `herbs` (merged) and `wip` (unmerged), lightweight tag `v0.1`, annotated tag `v1.0`).
  The header comment lists the shape; object ids are fixed, and the goal files embed them:
  HEAD tree `0d4542a`, README blob `ec5cadf` (77 bytes), docs tree `8ebbc49`, guide blob `323741b`,
  plants blob `7aec562`, tag object `bf47e4e`. Change the fixture and these answers must be recomputed.
- 14.13 to 14.18 build their own small repos in setup.sh.

## Format gaps

- `shell` checks (read-only) are used where no check type fits: "a pack exists" (14.13), "object no longer
  exists" (14.14, hardcoded id since marks are not expanded inside `shell` scripts), "fsck --full exits 0"
  (14.15, 14.18). A `fsck` or `objectExists` check type would remove all of them.
- `text` answers for object ids accept the full id and every prefix of 7 or more characters (generated lists).
  A `hash` question type with prefix matching would be cleaner.
- `usedCommand` regexes start with `\bgit ` rather than `^git ` so that `tree=$(git write-tree)` or
  `$(git merge-tree ...)` count; learners type such lines in plumbing lessons.
- 14.14 `git gc` behaviour: cruft packs are the default only since git 2.41. From 2.41 a plain `gc` puts the 6
  unreachable objects into a cruft pack (`count` 0, `in-pack` 15); on 2.32 to 2.40 it leaves them loose
  (`count` 6, `in-pack` 9). The question therefore asks for the total (count plus in-pack), 15 on every version,
  and the text describes both outcomes. `gc --prune=now` leaves 9 in-pack. `git repack -a -d` drops unreachable
  packed objects at once (no grace period); the text says so. `git prune` alone does not remove cruft-packed
  objects, so the text names `gc --prune=now` for removal.
- `usedCommand` defaults to exit 0. Commands that fail by design in this section use `"exitCode": null`:
  `git merge-tree --write-tree` (exit 1 on conflict, 14.16) and `git fsck` on the damaged repo (exit 3, 14.15).
- 14.15 and 14.18: the backup clone is made with `--no-hardlinks`; a plain local clone hardlinks loose objects
  and overwriting the corrupt object would damage the backup too. The damage is `rm` + write of garbage.
- 14.18 broken ref: a dangling *symbolic* ref (`refs/heads/release -> refs/heads/releases/1.0`). It was chosen
  because the graph snapshot used to abort on a ref holding a nonexistent id; the engine now skips such refs, so a
  plain ref file with a missing id would also work. The symref is kept because it matches the story ("pointed at
  a branch name that was later deleted"). `fsck` reports it as "invalid sha1 pointer 0000...". Fixing it with
  `update-ref`/`branch -f` writes through the symref and creates `releases/1.0`; `release` then resolves to
  v1.0's commit, which the `refAt` goal accepts. Deleting it with `symbolic-ref -d` and recreating the branch
  also passes.
- 14.18 `recovered` goal: exact content of `plans/launch.md` plus `commitChanges` exact and parent `main`, which
  pins the tree to the orphaned one without a shell check (a retyped, different plan fails).
- 14.12 lists `sha-repo` in `repos:` although it does not exist at lesson start (the learner creates it). The app
  handles this: a declared repo that does not exist yet has no snapshot until it is created.

## Deviations from LESSONS.md

- `requires` are exactly as listed. 14.14 (`reflog-expiry`) and 14.15 (`fsck-dangling`) refer to section 10
  skills; the validator errors clear once section 10 exists.
- 14.14 is flagged `destructive` (it deletes unreachable commits for good); LESSONS.md does not flag it.
- 14.17 is flagged `optional` as the brief asked.
- 14.10 shows `hash-object -w`, `update-index`, `write-tree`, `commit-tree`, `update-ref` although
  `hash-object`, `index-file` and `refs-plumbing` are in `requires`: LESSONS.md lists them as this lesson's
  teaching content (the full plumbing sequence), so they are shown. `git add`/`git commit` are forbidden by a goal.
- 14.05 and 14.06 show `git cat-file -p` (taught in 14.03, not in their `requires`).
- 14.16 asks for the blob id of the cleanly merged `notes.md` in the result tree rather than the result tree
  id, because the tree id depends on the argument order (conflict marker labels).
- 14.08 "full id" question is a `text` question accepting 7+ character prefixes; `commit` questions elsewhere
  use `@mark:`.
- 14.18 (boss) checks: ledger readable again, `release` at `v1.0^{}`, branch `recovered` whose tree holds
  `plans/launch.md` with parent `main`, `fsck --full` clean, plus two structure questions.

## Alternative approaches tried (all pass)

14.09 (`$(git rev-parse ...)` targets), 14.10 (`update-index --add` without `--cacheinfo`, `reset --soft`
instead of `update-ref`), 14.12 (`--object-format sha256` space form), 14.14 (`repack -a -d` instead of
`gc --prune=now`), 14.15 (`cat-file blob | hash-object -w --stdin` after removing the corrupt file),
14.16 (arguments in reverse order), 14.18 (`fsck --lost-found`, `branch recovered`, `symbolic-ref -d` +
`branch release v1.0`, hash-object restore).
