Lantern 1.0.0 is out, your export feature is on a branch, Sam has pushed to `main` since you branched, and a bug report just arrived for 1.0.0. Ship 1.1.0 and patch 1.0.0, using everything from this section.

## Your tasks

- Your branch `feature/export` has a leftover `DEBUG` print in `src/export.js`. Review the branch and remove it before it reaches `main`.
- Bring the branch up to date with what Sam pushed, then integrate it into `main` and push `main`. Afterwards `feature/export` should be gone locally and on origin.
- Cut release `v1.1.0`: an annotated tag on `main` that includes the export feature. Push it.
- Bug in 1.0.0: in `src/store.js`, `notes.slice(0, LIMIT)` keeps the oldest notes instead of the newest. Patch the released version: branch from `v1.0.0`, change it to `notes.slice(-LIMIT)`, and tag the fix `v1.0.1` (annotated). Push the tag.
- Carry the fix into `main` and push.
- Finish on `main` with a clean working tree.
