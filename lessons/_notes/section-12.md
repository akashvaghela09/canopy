# Notes: section 12 (Workflows)

Format gaps, deviations from `docs/LESSONS.md`, and things a reviewer should know.

## Fixture

- `_lib/fixtures/s12-team.sh`: the "Lantern" notes tool. Builds `origin.git`, `teammate` (Sam's clone, main
  tracks origin/main) and `work` (the learner's clone), five commits on main, mark `base` at the tip. Used by
  12.01–12.06, 12.08, 12.10, 12.11, 12.13. 12.07, 12.09 and 12.12 build their own small repos (12.07 and 12.09
  are local-only; 12.12 needs `upstream.git` + `fork.git` + `maintainer`).

## Format gaps

- **Engine behaviour (updated after review, 2026-10-03).** Marks written by actions are re-read on every check,
  goals are re-checked after every action, and each lesson attempt has its own global, system and XDG git config.
  12.06 and 12.10 still check Sam's work by content and by `refNotAt`, which works either way.
- **usedCommand exit codes.** `git diff --check` exits 2 when it finds whitespace problems, which is the whole
  point of running it; 12.11 sets `"exitCode": null` so any exit code counts. (The format doc only documents the
  default; `null` is accepted by the parser.)
- **"Use --force-with-lease, not --force"** is checked with `usedCommand` plus `not usedCommand` on
  `--force(\s|$)` / `-f(\s|$)` (12.03, 12.10). The Rust regex engine has no lookaround, so the plain `--force`
  pattern is excluded by requiring whitespace or end-of-line after it.
- **Request-pull output** cannot be checked from state; 12.02 checks `usedCommand ^git request-pull main <url>
  import-csv` plus state (branch published) plus questions about the reviewed branch.

## Deviations from LESSONS.md

- **12.02**: the "learner's summary" is three questions (commit count, file added, merged or not) rather than
  free text. `git branch -r --no-merged main` is the suggested way to answer the merged question.
- **12.03**: both branches are already on origin. `tags-ui` is "yours alone, pushed as a backup" so that the
  rebase is followed by `--force-with-lease` (a required skill); `export-pdf` is shared with Sam and gets a merge.
  A goal requires `--force-with-lease` and rejects plain `--force`/`-f`. Setup no longer pre-fetches into `work`, so the fetch goal starts open.
- **12.04**: "spot and fix two issues" = a `DEBUG` print and an accidentally committed `notes.tmp`. Any fix
  (new commit, amend, rebase) is accepted; `range-diff` is required by `usedCommand` because it is the lesson's
  point. The lesson stops before pushing.
- **12.05**: the target history is fixed to three commits (README-only, config-only with the fix folded in,
  test-only) in any order; checks use `any` over the three positions plus `commitChanges exact`. Subject
  convention is checked by regex `^[A-Z][^\n]{0,49}(\n|$)` and no `fixup!` left over. Autosquash is the
  suggested route but a manual `fixup`/`edit` rebase also passes (tested).
- **12.06**: "main stays linear" is checked with five `commitParents == 1` checks (`main`..`main~4`) in
  `origin.git`, plus `commitCount @mark:base..main == 5`. Squash-merge and rebase+fast-forward both pass.
  Teammate pushes are two actions (idempotent: they skip if their change is already on origin/main).
- **12.07** and **12.09** are local-only (no origin): the workflows are about branch/tag structure. 12.09 accepts
  cherry-pick or merge to carry the fix forward.
- **12.10**: adds `receive.denyNonFastForwards true` on `origin.git` as the "protected branch" step (the
  curriculum mentions protected branches; this is the git-only equivalent). The restore goal passes at the start
  by construction; the sticky "origin moved away" goal guarantees the action ran. A `-C ../origin.git` form is
  shown; `cd` into the bare repo also works.
- **12.11**: "measure conflicts" = merge main into `wide` (conflict) and `narrow` (clean), then two questions.
  `wide` may be merged or rebased (only the resolved content and ancestry are checked). `git diff --check` is
  demonstrated on a prepared unstaged README edit with trailing whitespace.
- **12.12**: adds a `maintainer` clone in setup (needed to build upstream history); it is listed in `repos`.
- **12.13 (boss)**: the hotfix targets `v1.0.0` (already in production) rather than the fresh `v1.1.0`, so the
  hotfix is a real side branch. Order between tagging 1.1.0 and the hotfix is free; checks are state-only. Note:
  `git branch -d feature/export` refuses after a rebase because the branch's upstream differs; `-D` or pushing
  first is needed (the reference solution uses `-D`).
- `requires` kept exactly as listed. Several lessons use older skills as real steps described by intent only:
  12.04 (amend/rebase to fix), 12.06 (switch, commit, push, branch delete), 12.10 (fetch), 12.11 (stash is
  optional), 12.13 (everything from the section).

## Side effects in the app

- 12.10 sets `receive.denyNonFastForwards` inside the lesson's `origin.git` only.
- No lesson in this section touches the global config.

## Review changes (2026-10-03, see `_reviews/section-12.md`)

- 12.09: the fix and the version bump are separate commits; only the fix is cherry-picked onto `main`. The hotfix
  branch goal is sticky, so deleting the branch afterwards is fine.
- 12.10: the action fires once (checked in Sam's local `main`); later presses say it already happened, or, once
  origin is protected, show Sam's retry being refused. The restore goal also rejects `+refspec` forces.
- 12.11: the README / `diff --check` step comes first, so the unstaged edit never travels to `wide`. The
  `diff --check` goal must be run while the edit is still uncommitted.
- 12.04: range-diff must be run after the branch differs from its pushed copy. 12.05: goals no longer pass at the
  start and require the tests after the config module. 12.06: leftover squash-merged task branches fail the last
  goal. 12.07: deleting the release branch no longer breaks goals (`main^2` stands for the release tip).
