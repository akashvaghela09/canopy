Sometimes you want a merge only if it is trivial. A typical case: you intend to update your branch with someone else's commits and want to be told, rather than silently get a merge commit, if your own branch has moved.

```
git merge --ff-only <branch>
```

fast-forwards when it can. When the branches have diverged, it refuses with `Not possible to fast-forward, aborting.` and changes nothing. Nothing to clean up, nothing to undo.

## Try it

1. Draw the history. `hotfix` is strictly ahead of `main`. `redesign` has forked.
2. Run `git merge --ff-only redesign` and read the refusal. Check that `main` has not moved.
3. Run `git merge --ff-only hotfix`. This one goes through.
4. Answer the question.

## What just happened

`--ff-only` is a safety check. It says: bring this in only if it costs nothing, and otherwise let me decide what to do. `redesign` still has to be merged properly or rebased; that is a decision for later, not something git should make for you.
