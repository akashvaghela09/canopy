Two folders, `merge-way` and `rebase-way`, hold the same repository: `main` has one new commit, `feature` has two. You will integrate `feature` both ways and compare.

- **Merge** keeps what happened: both lines stay visible, joined by a merge commit. Nothing is rewritten, so it is always safe, including on shared branches.
- **Rebase** rewrites your branch so it looks as if you started from the current tip. The history becomes one line, and afterwards `main` can take the branch with a fast-forward, no merge commit at all.

The rule that decides: rebase your own unshared commits as often as you like; never rebase commits that are already on a shared branch, because everyone who has the old ids would have to clean up after you.

## Try it

1. Go into `merge-way`. On `main`, merge `feature`. Draw the graph.
2. Go into `rebase-way`. Switch to `feature`, rebase it onto `main`, switch back to `main` and merge `feature`. Draw the graph: one straight line, and the merge was a fast-forward.
3. In each folder, list only the merge commits.
4. Answer the questions.

## What just happened

Both folders end with the same files. They differ only in the shape of the history, and that shape is what you choose between: a faithful record with merges, or a tidy line made by rewriting your own commits before they are shared.
