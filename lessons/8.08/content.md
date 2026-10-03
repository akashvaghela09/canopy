A stash parks your work so you can reuse the one working directory. A **worktree** avoids the problem instead: a second working directory, attached to the same repository, with a different branch checked out. Your half-finished edits stay where they are, and the urgent fix happens next door.

```
git worktree add <path> <branch>       check out an existing branch in a new folder
git worktree add <path> -b <branch>    create the branch at the same time
git worktree list                      every working directory of this repository
```

All worktrees share one history, one set of branches and one stash list. Only the checked-out files, the staging area and HEAD (the current branch) are per worktree.

## Try it

1. Check the status: `app.py` has uncommitted feature work. There is also a bug in `lib.py`: `area` should return `3.14 * r * r`.
2. Run `git worktree add ../hotfix -b hotfix`. A folder `hotfix` appears next to `work`, with the branch `hotfix` checked out.
3. Move into `../hotfix`. Check the status there: clean. Your edits stayed in `work`.
4. Fix `lib.py` in this folder and commit the fix.
5. Run `git worktree list`. Two entries, each with its own branch.
6. Move back to `work`. Your feature edits are untouched, and the graph shows `hotfix` one commit ahead of `main`.

## What just happened

Both folders are views of the same repository: the commit you made in `hotfix` is visible from `work`, because they share `.git`. The graph shows a HEAD per worktree. Merging `hotfix` into `main` is a normal merge, like any other branch.
