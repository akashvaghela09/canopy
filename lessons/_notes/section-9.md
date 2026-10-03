# Notes: section 9, rewriting history (lesson author)

Format gaps that came up, deviations from `docs/LESSONS.md`, and design decisions worth knowing when the
graph animation or the goal checker changes.

## Checking rewritten history

- Rewritten commits always get new ids, so no goal ever compares a learner-made commit to a hash. Results are
  checked by message (`commitMessage` on `branch~N`), content (`fileContent` with `source: <rev>`), file set
  (`commitChanges ... exact`), parents (`commitParents`), counts (`commitCount` over `@mark:base..branch`) and
  `refNotAt <branch> @mark:<original tip>` to prove a copy was made. Setup commits that must stay in place are
  checked with `refAt` against their mark.
- `commitCount` passes its `range` to `rev-list` split on whitespace, so `"--merges main"` and
  `"--no-merges main..editor"` work for "no merge commit" / "exactly one merge" goals (9.09, 9.10, 9.24, 9.25,
  9.27). This is a property of the implementation, not of the documented format; if the checker ever quotes
  the range as one argument these goals need a different check.
- `usedCommand` matches the whole history line, which for editor-driven commands starts with
  `GIT_SEQUENCE_EDITOR=...`. Every regex in this section uses `\bgit rebase\b` style anchors, never `^git`.
- `usedCommand` defaults to exit code 0. Commands that stop on purpose are matched with their real exit code:
  the `rebase -x` run that fails its test (9.22, exit 1), the refused `--force-with-lease` push (9.26, exit 1)
  and the refused cherry-pick of a merge without `-m` (9.08, exit 128). The harness does not require solution
  commands to exit 0, so these can be real steps of the solution.
- `commit` questions: solutions answer with `@mark:name` (9.01, 9.11, 9.14, 9.22). None of them sets
  `allowRefs`, so learners paste a hash prefix from the terminal, which is what the lesson text asks for.
- In-progress states are sticky milestones: `operation: cherry-pick` (9.07) and `operation: rebase` (9.11,
  9.14, 9.17, 9.18, 9.20, 9.22). 9.21 uses a sticky "three `fixup!` commits exist" milestone so the
  `--fixup` step cannot be skipped by squashing by hand.

## Editors

- Interactive rebases in solutions drive the todo list with inline `GIT_SEQUENCE_EDITOR="sed -i ..."` and
  commit messages with inline `GIT_EDITOR="sed -i ..."`. Reorder scripts use the hold space
  (`'1{h;d}' ... '3{G}'`); the boss solution does reorder, fixup, reword and edit in one list.
- Where a `!` is needed inside a sed script (9.16, keep only the "Add login form" line), the whole editor
  value is in single quotes so interactive history expansion does not touch it.
- `add -p` answers (9.19, 9.20) are fed as following lines in `solution.yaml`; each costs the harness its
  1.5 s "no prompt" wait, which is fine.

## Design decisions and deviations from LESSONS.md

- **9.01** is guided and shows `git commit --amend -m` before 9.02 teaches it, like 1.06 shows add/commit.
  The contrast with revert (a required skill) is a question rather than a step.
- **9.07**: `--skip` on a single pick ends the operation like `--abort`; the two are told apart by
  `usedCommand`. The goal for the third pick accepts `--abort` or `--quit`, because a learner who picks the
  three commits as one range must use `--quit` to keep the first pick (an `--abort` would undo it). In that
  range approach `--skip` exits 1 (the next pick conflicts at once), so the `--skip` goal is an `any` of
  exit 0 and exit 1. It deliberately does not use `"exitCode": null` (documented as "any exit code"),
  because a no-op `--skip` with nothing in progress exits 128 and must not count. A no-op `--quit` exits 0,
  so each of the three picks has a sticky milestone (`operation: cherry-pick` + `refAt CHERRY_PICK_HEAD
  @mark:f1/f2/f3`) proving it really stopped on its conflict. After `--quit` a conflicted file stays
  conflicted; the content and a hint say to restore it. (Review 9a.)
- **9.08** carries the `optional` flag as requested. The "try it without -m" step is a sticky goal matched by
  `usedCommand` with exit code 128 (options other than `-m`/`--mainline` are allowed), and a separate goal
  requires a pick with `-m 1` / `--mainline 1`, so picking the feature commit or `merge --squash` does not
  pass. (Review 9a.)
- **9.10** has two repos (`merge-way`, `rebase-way`) and starts the terminal at the lesson root (`start: "."`),
  so the learner changes folder; every check names its repo. Marks are prefixed (`m-*`, `r-*`) because the
  marks table is one namespace per attempt.
- **9.13** teaches only the "cut commits out of the middle" use as a task; the "transplant a range" form is
  explained in the text, to keep one idea per lesson. It is flagged `destructive` (the debug file is lost).
- **9.14** needed a second rebase that can be aborted. Saving the todo list unchanged finishes at once, so the
  text introduces `break` (a todo command, git 2.20+) to pause the rebase, then `git rebase --abort`. The
  learner never sees `git rebase --abort` before 9.11 otherwise; it is shown here as new.
- **9.17**: swapping two commits that append to the same place conflicts **twice** (once for each commit in
  its new position); this is inherent to three-way replay and cannot be reduced to one stop without making the
  second replay empty. The lesson says so up front and gives the target file for each stop. It is flagged
  `destructive` because of the dropped commit.
- **9.19**: the four hunks are spaced at least nine lines apart; closer edits are merged into one hunk by
  git's default context and the lesson would show three prompts instead of four.
- **9.20**: the two pieces live in one file, so `add -p` is a real step. Either order of the two new commits is
  accepted (`any` of two `all` blocks).
- **9.22**: picks that do not change are fast-forwarded by `rebase -i`, so the rebase stops on the *original*
  failing commit and `@mark:broken` is valid for the question.
- **9.23** sets `minGit: "2.38"`; **9.24** sets `minGit: "2.18"`; **9.26** sets `minGit: "2.30"`.
- **9.25**: the teammate's push happens in setup (before the learner starts), not as an action; the lesson is
  about the stale-clone situation itself. The "rebase" goal accepts `pull --rebase`, `fetch` + `rebase`, or
  `pull.rebase=true` + plain `pull`, all checked together with the linear end state.
- **9.26** uses one action (`teammate-push`), idempotent: Sam resets to `origin/login` and only commits if
  his file is missing, so the button can be pressed again to recover if the learner overwrote his commit.
  The task includes a rebase onto the moved `origin/main` so that `--force-if-includes` has something to
  protect against; the final push is accepted with or without `--force-if-includes`. A plain `--force` or
  `-f` push fails a goal.
- **9.27** (boss) names the target series explicitly in the text (messages and file split), since the goals
  check exact messages and file sets; the steps and commands are not given.
- `requires` lists are exactly as in LESSONS.md. Several lessons use older skills as real steps that are not
  in their list (e.g. 9.05, 9.16, 9.20 need `commit`; 9.26 uses `fetch`, `merge --ff-only`, `cherry-pick`
  is not needed). Text describes those by intent.

## Fixtures

- None shared. Every lesson builds its own small repo in `setup.sh`; remote lessons (9.25, 9.26, 9.27) build
  `origin.git`, `work` and `teammate` in setup, as section 7 does.

## Verification

- `canopy-lesson validate`: no section 9 errors other than prerequisites taught by sections not yet present
  when this was written (`switch`, `log-range`, `conflict-resolve`, ...).
- `canopy-lesson test 9`: 27 ok. One alternative solution per lesson 9.02 to 9.27 also passes (option
  spellings, `rebase -i` with `edit` instead of `reword`, `drop` instead of `--onto`, three `--onto` rebases
  instead of `--update-refs`, `rebase -r`, `pull.rebase` config, `--force-with-lease=<branch>`, a three-rebase
  boss solution).
