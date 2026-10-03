# Notes: section 8, Stashing and worktrees (lesson author)

## Shape of the section

- Every lesson builds its own small repo in `setup.sh` (a "garden planner" project: `app.py`, `lib.py`,
  `config.toml`, `README.md`). No shared fixture.
- The repo folder is `work/` in every lesson so that the worktree lessons can use `../hotfix` and friends,
  which still resolve inside `LESSON_ROOT` (`work/../hotfix` = `LESSON_ROOT/hotfix`).
- Stash state is checked with the `stash` check (`count`, `messageContains`) and with
  `fileContent { source: "stash@{0}" }`, which works because a stash entry is a commit.
- Worktrees: `worktreeCount` on `work`, plus checks with `repo: hotfix` / `repo: review` pointing at the
  second worktree folder, and `pathAbsent` for removed worktrees. 8.08 and 8.09 list the second worktree in
  `repos:` (8.08's does not exist until the learner creates it; the graph should tolerate a missing repo
  entry or show it once it appears).

## Format gaps

- **`commit` question for a stash entry (8.02).** The natural answer is `stash@{1}`, which is a ref, so the
  question sets `allowRefs: true` and the solution answers `@mark:cfg-stash` (marked in setup with
  `mark cfg-stash 'stash@{2}'`). The config stash is deliberately the oldest entry, so the answer is not the
  `stash@{1}` used as an example in the content and hints, nor the prompt's `stash@{n}` form. Stash indexes are stable in that lesson because nothing is popped.
- **Order of commands.** Order can be expressed: a sticky `all` of `usedCommand` with `"last": true` plus a state
  check latches only if the command ran while the repo was in that state (see `docs/LESSON_FORMAT.md`). 8.05 does
  not enforce the plain `stash` / `-u` / `--keep-index` sequence on purpose; it grades the `-u` result (sticky,
  including `notes/draft.md` in `stash@{0}^3`), `--keep-index`/`-k` usage and the final state.
- **History expansion**: a `!` inside double quotes in a solution line is eaten by interactive bash (the
  command never runs). 8.06's solution uses single quotes with `'\''` for the greeting line.

## Deviations from LESSONS.md

- **8.01**: the stash is left in place at the end (pop is 8.03); goals: stash exists with the README change,
  `release-notes` visited (sticky), back on `main` with a clean tree. The refusal of the dirty switch is a
  step in the text but not a goal, since a learner who stashes first cannot reproduce it.
- **8.02**: the three stashes are made on the same commit so their default names are identical and only
  `stash show` can tell them apart. Setup uses plain `git stash` (no `-m`), which 8.04 teaches later; the
  learner only reads the list.
- **8.03**: setup uses `stash push -m` (taught in 8.04) so the remaining entry can be recognised by message.
  "apply both then drop stash@{0}" is accepted as an alternative.
- **8.05**: `--all` is explained but not exercised (it would stash the ignored log; the lesson's point is that
  ignored files stay). The final state requires `config.toml` staged and the `app.py` edit parked; combining
  `-u --keep-index` is accepted.
- **8.06**: the resolution text is prescribed ("Hello there, gardener!") so the goal can check content;
  committing the resolution is optional. The stash entry must be dropped by hand (that is the lesson).
- **8.07**: committing on the new branch is optional; the goal accepts the change in the worktree or in HEAD,
  and any branch that contains the base commit but not `newer` (so a branch made from `main` fails).
- **8.08**: the hotfix is *not* merged into `main` (kept for the boss). `repos:` lists the `hotfix` folder.
- **8.09**: `move` and `lock` are text only; the stale worktree is produced by `rm -rf` in setup, `remove`
  and `prune` are graded by `worktreeCount: 1` plus `pathAbsent`, plus `usedCommand` for `worktree remove ...review`
  (so `rm -rf` + `prune` does not count as removing it). The refused `worktree add ../again main` is
  graded with `usedCommand` + `exitCode: 128` (verified: no folder is left behind).
- **8.10 (boss)**: both routes pass: stash (`-u`, fix, commit, pop) and worktree (`add ../fix -b hotfix`,
  commit, `merge --ff-only hotfix` in `work`, remove worktree). The fix commit must touch only `lib.py`
  (`commitChanges exact`; a `--no-ff` merge whose second parent is that fix on top of `base` is also accepted), the
  feature work must be back in `work` and absent from `main`. A sticky goal requires that a stash holding the
  feature work existed or a second worktree was added, so committing only `lib.py` in place does not pass.
  `requires` lists the real skill ids instead of `[section]`.
- `minGit: "2.23"` on 8.01, 8.07, 8.08, 8.10 (they use `git switch`).
