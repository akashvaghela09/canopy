# Notes: section 7, Remotes (lesson author)

## Shape of the section

- Every lesson builds `origin.git` (bare), `work/` (the learner's clone) and, where needed, `teammate/`
  (Sam's or Priya's clone) with the shared fixture `_lib/fixtures/s07-team.sh`. The fixture only defines
  functions (`s07_origin`, `s07_work`, `s07_teammate`); the project is a small "trails" hiking-club site
  with three commits by three authors (marks `base`, `ridge`, `lake`). No network anywhere.
- 7.01 and 7.17 start in the lesson folder (`repo: work`, `start: "."`); the learner runs the clone.
  Goals on the default repo simply fail (check error) until `work/` exists, which is the intended start.
- Things that happen "while the learner works" are actions. Each action sources `setup-lib.sh`, does
  `goto teammate; as sam`, first runs `git pull -q --no-rebase origin main` (so it never gets rejected if the
  learner pushed first), then commits only if its change is not already in HEAD, then pushes. Presses that
  add nothing print "Sam has nothing new to push." instead of claiming a push. The other actions are safe to
  press repeatedly and push nothing new after the first time (7.04, 7.07, 7.15, 7.17).
- **Staged actions (review fix).** 7.05, 7.06 and 7.12 share a staged action: first press "Fix lake trail
  distance", second press "Add parking note to lake trail", every later press one more "Checked: ..." line on
  `trails/lake.md`. Sam always has something new, so *early* presses (one or several, before the learner's
  first fetch/pull) are harmless: the learner's fast-forward simply includes them, and the next press after
  the learner's own commit supplies the divergence. Their fast-forward goal is therefore "river is in main, main ==
  origin/main, on main" (not `refAt @mark:river`), and the merge goal also requires `origin/main` to be in
  `main` with at least one own commit on top (`origin/main..main` >= 1), which also rejects `reset --hard
  origin/main`. 7.16's action was already staged ("Add river trail", then "Fix lake trail distance").
- 7.15's teammate fetch uses `--tags --force`, so a tag the learner corrected and force-pushed replaces Sam's
  stale copy instead of failing with "would clobber existing tag"; the goal checks Sam's v1.0 is annotated and
  at `@mark:lake`.
- Verified by pressing every action three times, before the learner did anything, and after the learner had
  already pushed.
- Teammate commits made in *setup* are marked (`@mark:river`, `@mark:signage-tip`, `@mark:merged`) and used
  in checks. Commits made by *actions* are not marked (marks are read once, before the solution runs), so
  those are checked by file content (`trails/river.md` present, `Distance: 6 km`, `Parking`).

## Decision: `git pull` and divergent branches

Modern git refuses a plain `git pull` when histories diverge and prints the `pull.rebase` hint.

- **7.06 (pull)** leaves the clone unconfigured on purpose. The learner sees the hint, the content explains
  it, and teaches `git pull --no-rebase` / `git config pull.rebase false` as the "merge" answer. The content
  tells the learner not to use `--global` (Canopy's global config is shared by every lesson).
  The refusal is git 2.33.1+ behaviour (before that, plain pull warned and merged), so 7.06 has
  `minGit: "2.33.1"` and a row in the LESSONS.md version table.
  `pull --rebase` is not mentioned beyond "rebasing comes later" (9.25).
- **7.08, 7.12, 7.16** set `pull.rebase false` in the work clone's local config in setup, and the content
  says so in one line. In 7.12 this is what makes the lesson's point: a plain pull there would merge silently,
  `--ff-only` refuses instead.
- **7.17 (boss)** cannot preconfigure the clone (the learner makes it). A hint says to use
  `git pull --no-rebase` if git asks. The reference path never diverges on `main`, so the question only
  comes up if the learner merges locally before pulling (tested; works with the hint).

## Format gaps

- **No check for remote-tracking refs.** `branchExists` only looks at `refs/heads`. 7.13 needs "origin/scratch
  is gone" and uses `not` + `commitCount { range: origin/scratch, min: 0 }` (rev-list fails on a missing ref,
  so the inner check is false). A `refExists`/`remoteBranchExists` check would read better.
- **Cross-repo comparison.** "work's `origin/main` equals origin.git's `main`" cannot be stated directly; the
  lessons compare both sides to a mark or to file content instead.
- **Actions cannot create marks** that the checker sees (marks are loaded once at start). Content checks
  cover it, see above.
- **Non-zero exits in solutions are fine** (the harness only records exit codes); 7.03, 7.06, 7.08, 7.10,
  7.11 and 7.12 rely on a refused command as a step and 7.03/7.08/7.12 grade it with `usedCommand` +
  `exitCode`.

## Deviations from LESSONS.md

- **7.02**: the `git branch -r` count question excludes the `origin/HEAD -> origin/main` line explicitly, and
  the content explains that line (it is the remote's default-branch pointer, not a branch).
- **7.04**: the teammate's push is an action (as the curriculum says); the action pushes *two* commits so the
  "how many came in" question is not guessable.
- **7.05 / 7.06 / 7.12** reuse one scenario (Sam's river trail already on origin, then Sam's lake fix via
  action) so the learner can compare fetch+merge, pull, and pull --ff-only on identical histories.
- **7.07**: "verify the teammate sees it" is a goal (`repo: teammate` check) and needs the "Teammate pulls"
  action to be pressed; the content says so.
- **7.08**: the teammate pushes in *setup*, not via an action, so the rejection is guaranteed whatever the
  learner does first. Git's rejection text differs depending on whether the learner fetched before pushing;
  the content quotes the unfetched variant (`(fetch first)`, "remote contains work that you do not have
  locally") and names the fetched variant (`(non-fast-forward)`) in one sentence.
- **7.09**: ahead/behind is read on `main` (ahead 2, behind 1); the upstream is set on a second branch
  `signage` created with `--no-track` in setup. `@{u}..` is graded with `usedCommand`.
- **7.11**: the teammate's branch is pushed in setup *after* the learner's clone was made (so a fetch is still
  required, and `git switch signage` fails first), instead of via an action, for robustness.
- **7.13**: "clean stale tracking branches" uses a second branch `scratch` that Sam deleted on the remote after
  the clone, because `push --delete` already removes the learner's own `origin/winter-closures`.
- **7.14**: the four verbs are exercised as add `upstream` (a fork scenario with `upstream.git`), remove a dead
  `backup`, rename `origin` to `fork`; `get-url`/`set-url` are shown in the text only. Renaming `origin` also
  moves `main`'s upstream to `fork/main`, which the goal checks.
- **7.15**: deleting the wrong tag *locally* is asked for by intent only; `tag-manage` (5.16) is now in
  `requires` for it.
- **7.17 (boss)**: the conflict is produced by both sides appending a line at the end of `trails/lake.md`;
  the goal checks both lines are on origin's `main` with no markers. The branch must be published before the
  teammate action for a real conflict; if the learner merges and pushes first, the action's teammate pulls
  and the merge is trivial, which the goals also accept.
- `requires` kept exactly as listed; several lessons use `add`/`commit`/`switch` as real steps described by
  intent.
- `minGit: "2.23"` on 7.03, 7.09, 7.10, 7.11, 7.17 (they use `git switch`).
