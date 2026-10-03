`git rebase <base>` moves every commit your branch has and `<base>` lacks. Sometimes that is too much. The long form says exactly which slice to move and where:

    git rebase --onto <newbase> <oldbase> <branch>

Read it as: take the commits in `<oldbase>..<branch>` (the same range as in the log), and replay them on `<newbase>`. The branch name is optional; without it, the current branch is used. With it, git switches to that branch first.

## Try it

1. Draw the graph. `api` has two commits on top of `main`. `ui` was started from `api` and has two commits of its own, but it turned out not to need the API work at all.
2. List the commits that `ui` has and `api` does not. Those are the two that should move.
3. Move `ui` so that its two commits sit directly on `main`, leaving the `api` commits behind.
4. Draw the graph again: `ui` is two commits long on top of `main`; `api` is unchanged.

## What just happened

`<oldbase>` only marks where the slice starts; git does not touch it. `api` still has its two commits, `main` did not move, and `ui` now has nothing from `api` at all, so `api.js` is gone from `ui`'s files.
