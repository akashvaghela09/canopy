A plain rebase flattens: it replays the individual commits and leaves merge commits out. If your branch contains a merge you want to keep, say so:

    git rebase --rebase-merges main

Git rebuilds the same shape on the new base: the side branch's commits are replayed, and the merge is made again. In interactive mode the todo list for this uses extra commands (`label`, `reset`, `merge`) to describe the shape.

## Try it

1. Draw the graph. `editor` has two commits, then a merge that brought in `editor-undo`, then one more commit. `main` has moved on by one.
2. Rebase `editor` onto `main`, keeping the merge.
3. Draw the graph again: the same shape, with its loop, now on top of `main`. Every commit in it has a new id.
4. Answer the question.

## What just happened

Compare with 9.09: there the branch was a line and stayed a line. Here the merge commit was recreated with two new parents. Note that `editor-undo` itself still points at its old commit; only the branch you rebased moved, unless you also pass `--update-refs`.
