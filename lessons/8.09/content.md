Worktrees need a little housekeeping, and one rule: a branch can be checked out in only one worktree at a time. Git refuses a second checkout, because a commit made in one folder would move the branch under the other, leaving its files out of step.

```
git worktree remove <path>     delete a worktree folder and forget it (refuses if it has changes)
git worktree prune             forget worktrees whose folders were deleted by hand
git worktree move <path> <new> move a worktree folder
git worktree lock <path>       protect one from prune, e.g. on a removable drive
```

## Try it

1. List the worktrees. Three entries: `work` on `main`, `review` on `review`, and `scratch`, marked prunable because its folder was deleted with `rm -rf` instead of `worktree remove`.
2. Try to add a worktree at `../again` with `main` checked out. Git refuses. Answer the question.
3. Clean up the deleted one with `git worktree prune`. List again.
4. The review is finished: remove its worktree with `git worktree remove ../review`. The branch `review` survives; only the folder goes.
5. List them one last time: only `work` remains.

## What just happened

Deleting a worktree folder by hand leaves a stale record behind; `prune` clears it. `remove` does both steps at once and refuses to throw away uncommitted changes; it also works on a worktree whose folder is already gone. The refusal ("already checked out" in older git, "already used by worktree" in git 2.42 and later) is the same safety rule that stops you switching to a branch that another worktree is using.
