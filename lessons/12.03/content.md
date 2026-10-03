A branch that lives for more than a day falls behind `main`. Bringing it up to date is routine, and there are two ways to do it:

- **Rebase onto main.** Your commits are replayed on top of the new `main`. The branch stays linear and reads as if you had started today. The commits get new ids, so anyone else who has the branch now holds a different history.
- **Merge main into the branch.** One merge commit brings the new work in. Nothing that existed before changes, so people who share the branch are not disturbed.

The rule most teams use: rebase branches that only you have, merge into branches other people have too. A branch you pushed as a personal backup still counts as yours; after a rebase you update that copy with `--force-with-lease`, which refuses if origin's copy has moved since you last fetched it.

## Try it

Sam pushed two commits to `main` while you were away. You have two branches to bring up to date.

1. Fetch, and compare your `main` with `origin/main`.
2. `tags-ui` is yours alone; the copy on origin is only a backup. Switch to it and rebase it onto `origin/main`. Then update the backup copy on origin.
3. `export-pdf` is shared with Sam; your clone and origin both have it, and Sam has it too. Switch to it, bring in Sam's latest commit on that branch, then merge `origin/main` into it. Push it.

## What just happened

In the graph, `tags-ui` sits on top of the newest `main` as a straight line. `export-pdf` keeps its old commits and gains one merge commit. Both branches now contain Sam's changes, and both were updated on origin without rewriting anything Sam holds.
