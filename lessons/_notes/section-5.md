# Notes: section 5 (lesson author)

Format gaps that came up, and places where the lessons deviate from `docs/LESSONS.md`.
Nothing here was invented in the files; each item uses the closest existing option.

## Fixtures

- `_lib/fixtures/s05-trail.sh`: the `trail-guide` repo, four linear commits on `main`, no
  branches or tags. Used by 5.01 to 5.07 and 5.10, 5.12 to 5.16. Lessons that need a side
  branch (`new-stuff`/`tmp` in 5.10) or tags (5.15, 5.16) add them in their own `setup.sh`,
  so the fixture stays reusable. The `winter` branch shared by 5.03, 5.06 and 5.07 comes from
  the fixture's `add_winter_branch` function, which those setups call (same hashes as before).
  Ref files are inspected in 5.12; the engine pins `GIT_DEFAULT_REF_FORMAT=files` for setup
  and the learner shell, so `.git/refs/heads` exists even where reftable is git's default.
- `_lib/fixtures/s05-garden.sh`: the `garden` repo with diverged branches for 5.08, 5.09
  and 5.11: `herbs` (two unmerged commits), `pests` (merged with a merge commit), `labels`
  (merged, tip is an old commit of main). The merge commit is only read, as in section 3.
- 5.17 builds its own `shop` repo in `setup.sh`.

## Harness and checker

- **Sticky goals work in the harness** now (goals are re-checked after every solution
  command), so 5.07 (three scenarios in order), 5.11 (the `-d` refusal) and 5.13 (visit the
  old commit, commit while detached) use `sticky` state goals rather than `usedCommand`.
- **Expected failures** are graded with `usedCommand` + `exitCode`: 5.07 (`git switch main`,
  `git switch -` or `git checkout main` refused, exit 1) and 5.11 (`git branch -d experiment` refused, exit 1). The harness no
  longer requires solution commands to exit 0, so these are real steps in `solution.yaml`.
  5.14's plain `git describe` (exit 128, no annotated tags) is also run on purpose.
- **Commits made while detached or on a deleted branch** are checked with
  `commitMessage`/`reachable` on `@mark:` ids. `resolve_commit` uses `rev-parse --verify`,
  which resolves dangling commits, so 5.11 can assert "the commit still exists" (`commitMessage`)
  and "nothing reaches it" (`not reachable`) at the same time.
- **No way to check command order.** 5.11 asks for the merged-branch list before deleting and
  5.09/5.08 ask for a graph first; only "was used" can be checked.
- **Guard goals that pass at start** (one per lesson at most, by design): "main did not
  move" (5.04, 5.10, 5.13, 5.16, 5.17), "Still on main" (5.02), "No branch moved" (5.03),
  "v0.1 is still lightweight" (5.15), "HEAD attached to a branch" (5.13). They block
  shortcuts; the harness only objects when every goal passes at start.
- **5.07 scenario 3** needs a successful `git switch main` (or `switch -`/`checkout main`,
  exit 0) so it cannot pass at the start; a learner who types `git switch main` while already
  on main satisfies that sub-check early, but scenarios 1 and 2 (sticky) still have to happen.
- **Commit questions** take hash prefixes only (`allowRefs` is left off everywhere in this
  section, so e.g. `weekend-walks` cannot be typed back in 5.01). Solutions answer with
  `@mark:<name>`.
- **Unreachable commits stay in the graph, gray** (the snapshot adds HEAD-reflog commits). 5.11
  and 5.13 describe them that way rather than as disappearing.
- **Interactive bash**: no `!` is typed in this section. Tag patterns are single-quoted
  (`git tag -l 'v*'`) so the shell does not expand them.
- **`currentBranch` with `name: null`** is used for "HEAD is detached" (5.13) and
  `not`-wrapped for "attached again"; the checker uses `symbolic-ref`, which is correct.

## Deviations from LESSONS.md

- **5.02** adds a commit on `main` after creating the two branches (the curriculum lists
  `commit` in `requires`), so "branches stay where they were" is observed, not only stated.
- **5.03** ends on `winter` (switch, back with `-`, switch again) so the final state differs
  from the start; LESSONS.md only says "switch between branches".
- **5.06** is flagged `guided` in addition to `destructive` (LESSONS.md marks neither). The
  lesson's purpose is the table mapping each `checkout` form to `switch`/`restore`, which
  cannot be written without showing the required commands. `destructive` because
  `checkout -- <file>` discards an edit (one the learner makes in the lesson).
  `git checkout <commit>` is in the table but not required; detaching is taught in 5.13.
- **5.07** runs the three scenarios in one repo in a fixed order rather than three separate
  repos: the README edit (same in both branches) travels, the lake edit (file differs) is
  blocked, then commit or restore. The final goal accepts commit, restore,
  `--discard-changes` and a clean `-m` as the "safe fix", but not a `-m` that left
  `trails/lake.md` conflicted (conflicts are section 6; the text warns about it). A goal that the README edit is still
  uncommitted at the end was dropped so that `--discard-changes` is not failed.
- **5.08 / 5.09** keep `diff-commits` and `diff-options` in `requires` as listed; the diff is
  mentioned only as a contrast (two dots vs three dots), and a stat diff is asked for in 5.09 (the
  step describes it, without showing `--stat`).
- **5.11** keeps `herbs` (unmerged, wanted) and adds a throwaway `experiment` branch so the
  forced delete is "truly intended"; a question and a `commitMessage` goal stress that the
  commit survives the delete.
- **5.12** mentions `packed-refs` in the closing paragraph only; a fresh `git init` repo has
  loose refs, so the lesson never shows a packed file.
- **5.13** does not show `switch -c` in the text (it is in `requires` as `switch-create`); the
  text describes the step and the last hint gives the command. The branch name `ideas` is
  fixed so the final "the commit is on a named branch" goal can be checked without knowing the
  learner's commit id. Ending on `ideas` or on `main` are both accepted.
- **5.14** uses `git describe --tags` (and the failing plain `describe`) as the `describe`
  recall step, which also sets up 5.15's "describe uses annotated tags" point. `show` is a
  step but its command is not shown.
- **5.15** fixes the tag message ("Trail guide 1.0") so the `tag` check's `message` field
  can be used; 5.16 does the same for the moved tag.
- **5.17 (boss)**: goals only. The "rename one" goal is a pre-existing branch `wip` that must
  become `feature/cart` on the same commit; "delete the finished one" is `old-banner`, whose
  tip is an old commit of `main` (so `branch --merged` identifies it and `-d` works). The
  three new branches are checked by ancestry (`isAncestor`, `not isAncestor`, `commitCount
  <start>..<branch> min 1`) so any number of commits and any content pass. `requires` lists
  the real skill ids instead of `[section]`.
- **minGit "2.23"** on 5.03, 5.04, 5.05, 5.07, 5.13 and 5.17 (they need `git switch`).
