# Notes: section 6, Merging (lesson author)

Gaps in the format or harness that came up, and places where the lessons deviate from `docs/LESSONS.md`.
No fields were invented; every check uses the documented types.

## Harness and checker

- **Non-zero exits are fine in solutions.** The harness records each command's exit code but does not fail
  on it, so solutions can run a conflicting merge (`exit 1`), a refused `--ff-only` (`exit 128`) and a refused
  `branch -d` (`exit 1`) as real steps. 6.05 and 6.06 grade those refusals with `usedCommand` + `exitCode`.
  (The section 3-4 notes say otherwise; that was not the behaviour observed here.)
- **Sticky goals work under `test`.** The harness re-evaluates goals after every command, so 6.10, 6.14, 6.15
  and 6.17 use `sticky` for intermediate states (merge in progress, merge made before being undone, file gone
  before being re-applied, squash commit before being removed).
- **`commitCount` with extra rev-list flags.** The `range` string is split on whitespace and passed to
  `rev-list --count`, so `"range": "main --merges"` counts merge commits. 6.16 and 6.17 use this to say "exactly
  N merge commits on main" (which is what proves the `nav` branch arrived by fast-forward in the boss). A
  dedicated field would be cleaner; if `range` ever stops accepting flags, these two goals need a `shell` check.
- **`usedCommand` and option order.** Rust regexes have no lookaround, so "has `--ff-only` and names `redesign`,
  in any order" is written as an alternation of both orders (6.05, 6.06, 6.13, 6.16). An "all of these tokens"
  form for `usedCommand` would read better.
- **Revert-of-a-revert title.** git 2.43 writes `Reapply "..."`; older versions write `Revert "Revert "..."`.
  6.15 accepts both.
- **Catalog loading.** `Catalog::load` reads every `lessons/N.NN` folder and fails if any lacks `lesson.yaml`.
  While other sections were being written in parallel, `canopy-lesson test 6` failed on their half-written
  folders, so section 6 was verified against a copy of the lessons folder containing sections 1-4 and 6 only,
  then again against the real folder once it loaded.
- **Guard goals that pass at start.** 6.10 ("main back where it was"), 6.11 (files that main already has),
  6.14 ("newsletter still has its commits") and the clean-tree goals pass after setup by design; each lesson has
  state goals that do not.
- **Editor.** In the app, `git merge <branch>` (6.02-6.04, 6.14), `git commit` after a resolution
  (6.09, 6.11-6.13) and `git revert` (6.15) open the in-app editor; content says "the editor opens, save it".
  Solutions use `--no-edit` or `-m` as the brief asks. 6.03 teaches `--no-edit`/`-m`/`--edit`.

## Deviations from LESSONS.md

- **6.01** starts the learner on `add-soup`, not `main`, so that `switch` is a real step. The "no new commit"
  check is `commitParents main == 1` plus `commitCount main == 4` and `refAt main == tip`.
- **6.06** ends with the branch force-deleted after the refusal was read ("try to delete the branch and see why"
  is kept as a graded `-d` refusal; deleting with `-D` makes `branch-delete` a real step). `reset-soft` is a
  required skill only as a comparison in the text (the staged squash result "is like after a soft reset").
- **6.07** uses its own busy history (three merged branches, four authors) built in `setup.sh`; no shared
  fixture was needed, so no `fixtures/s06-*.sh` files exist.
- **6.08** leaves the merge in progress at the end (the lesson is about reading a conflict; resolving is 6.09).
  The `diff` requirement is a step (`git diff` during the conflict) graded with `usedCommand`.
- **6.11** covers exactly four situations: both modified (take ours), both added (take theirs), deleted by them
  (keep), deleted by us (accept). LESSONS lists both-added and delete/modify; the both-added case doubles as
  the "take theirs" case to keep the lesson to one merge. `minGit: "2.23"` because `restore --ours/--theirs` is
  the taught form (`checkout --ours/--theirs` is mentioned and accepted).
- **6.12** adds a final "resolve and commit" goal beyond "answers match", so `conflict-resolve` is a real step.
  Any resolution is accepted (no markers, two parents).
- **6.13** does not set `minGit`: the lesson teaches `diff3` and `checkout --conflict=diff3`, which work on every
  supported git; `zdiff3` is mentioned as a 2.35+ option and accepted by the goals. Setting the config key is
  described by intent (`config-identity` is a required skill) and graded with a `config` check at `local` scope.
- **6.14** has the learner make the merge first (sticky goal), then undo it, so `merge-three-way` is a real
  step. Flagged `destructive` (hard reset).
- **6.15** the shared merge is made in setup (fixed hash, found via `--merges`). The final check accepts either
  revert-of-revert title (see above) and requires exactly two new commits after the pre-existing tip.
- **6.16** also requires the `-X theirs` and `--no-commit` command forms via `usedCommand`, since the lesson is
  about those options; the state checks alone could be met by hand-resolving. `-X ignore-space-change` is
  explained but not exercised (no third merge, to keep the lesson short).
- **6.17 (boss)** lists real skill ids in `requires` instead of `[section]`, like the earlier bosses. The
  "undo one of them" is the squash commit; both a hard reset (reference solution) and a revert (alternative)
  pass, since the goals check that `analytics.js` is absent from `main` and the branch still exists. The
  fast-forward requirement is proved by `isAncestor nav-tip main` together with "exactly one merge commit on
  main". Flagged `destructive` because of the hard reset.
- Lessons that need an older skill not in their `requires` list (`add`/`commit`/`log` in several, `branch-merged`
  in 6.01's step 2) describe it by intent only; `requires` is kept exactly as LESSONS.md lists it.
- **Recall rule, same-command cases.** 6.02 shows `git merge <branch>` although `merge-ff` is required, and 6.14
  shows `git reset --hard HEAD~1` although `reset-hard` is required: in both the taught skill *is* that command
  applied to a new situation (a diverged branch; a merge commit), as LESSONS.md lists it. Every other required
  skill is described by intent only.

## Changes after review (lessons/_reviews/section-6.md)

- Content accuracy: 6.09 (`merge --continue` vs `commit`: both refuse unresolved files), 6.10 (`--abort` discards edits;
  warning about uncommitted changes before a merge), 6.15 (re-merging after a revert brings only new commits; the
  merge was made in setup), 6.16 (`--no-commit` still fast-forwards, use `--no-ff`; `-X` does not settle modify/delete;
  `-X ours` vs `-s ours`; `ignore-space-change` wording), 6.08 (combined-diff ` +`/`+ `/`++` columns), 6.13 (marker
  labels differ between `checkout --conflict` and a merge; `restore --conflict` mentioned), 6.12 (touching-line
  conflicts), 6.01, 6.14 wording.
- Goals: 6.08 conflict goal is sticky (learner may abort after answering); 6.09, 6.13 and 6.17 resolution goals reject
  leftover old lines and `=======`; 6.13 accepts `git restore --conflict=diff3`; 6.03 message match is case-insensitive;
  6.07 accepts "branch hotfix" / "Merge branch 'hotfix'"; 6.12 also checks `main^1`.
- 6.17 `requires`: `merge-undo-reset` replaced by `reset-hard`, since the undone commit is the squash commit (one
  parent), not a merge.
- 6.08's status/diff goals and 6.12's "list the unresolved paths" goal use `usedCommand` with `"last": true` plus
  `operation: merge`, sticky, so the command must be run while the merge is in progress.
