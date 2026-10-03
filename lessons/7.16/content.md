Working with a remote settles into a rhythm:

1. **Commit** your work locally.
2. **Fetch** to learn what the team pushed meanwhile.
3. **Inspect**: the short status with branch info for ahead/behind, and the range `main..origin/main` for what is incoming.
4. **Integrate** the remote's work into your branch (pull, or merge `origin/main`).
5. **Push**.

If a push is rejected, you skipped a step: go back to 2. Fetching before you push is a habit, not something git forces on you. If you skip it, the remote rejects the push and sends you back to step 2.

This clone has `pull.rebase false` set, so pull merges.

## Try it

Two rounds, with Sam pushing in between.

**Round 1.** Add the line `Water: none on the trail` to `trails/ridge.md` and commit. Press **Teammate pushes**. Go through fetch, inspect, integrate, push.

**Round 2.** Create `trails/meadow.md` with a title line and a distance line and commit. Press **Teammate pushes** again (Sam pushes something different this time). Fetch, inspect, integrate, push.

Finish with `main` and `origin/main` on the same commit and a clean working tree.

## What just happened

Every round ended with the remote holding both your work and Sam's. The inspect step is the one people skip; it is also the one that tells you whether the integration will be trivial or needs care. In later sections you will replace the merge in step 4 with a rebase when the team prefers linear history, but the shape of the routine stays the same.
