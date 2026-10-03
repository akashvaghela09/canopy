A bug report arrives for the version customers run, not for the version on `main`. `main` has moved on since the release and holds unfinished work, so you cannot ship it. A hotfix branches from the released tag, fixes only the bug, and becomes a new patch release. Then the same fix is carried into `main`, so the next release does not bring the bug back.

Carrying the fix forward has two shapes. Cherry-pick the fix commit onto `main` when you want only the fix. Merge the hotfix branch into `main` when you want the graph to show that the release line fed back in; a merge brings the version bump along too, so `VERSION` on `main` then needs correcting. Either way the fix exists in both lines.

## Try it

`v1.0.0` shipped with a bug in `src/store.js`: `trim` keeps the *oldest* notes, but the comment and the users expect the most recent ones. `main` already has three newer commits that are not ready to ship.

1. Create a branch `hotfix/1.0.1` that starts at `v1.0.0`, and switch to it.
2. In `src/store.js`, change `notes.slice(0, LIMIT)` to `notes.slice(-LIMIT)` and commit. Keep this commit to the fix alone.
3. Set `VERSION` to `1.0.1`, commit, and tag that commit `v1.0.1` with an annotated tag.
4. Carry the fix into `main`: switch to `main` and cherry-pick the fix commit, not the version bump. `main` is heading for its own next version.

## What just happened

`v1.0.1` sits two commits after `v1.0.0`, off to the side of `main`: the fix and the version bump. `main` has the same fix as a new commit on top of its own work. Compare `git show v1.0.1~1` and `git show main` to see the same diff twice with different parents.
