Before a command that moves your branch in one big step (a merge, a pull, a rebase, a reset), git saves the old tip in a file called `ORIG_HEAD`. It is a bookmark for "where I was before that". To go back:

```
git reset --hard ORIG_HEAD
```

Why not `HEAD~1`? After a *fast-forward* pull there is no merge commit; the branch jumped ahead by however many commits came in, and `HEAD~1` would land somewhere in the middle of them. After a real merge, `HEAD~1` happens to be right, but you have to know which kind you got. `ORIG_HEAD` is right either way. (The reflog is right too, and keeps working after the next command overwrites `ORIG_HEAD`.)

## Try it

1. Sam has pushed two commits. Pull them in. Watch the log: your `main` fast-forwarded.
2. You wanted to review them first. Reset `main` hard to `ORIG_HEAD`. `main` is two commits behind `origin/main` again; Sam's commits are still there, on `origin/main`.
3. Now merge the `experiment` branch into `main`. It diverged, so you get a merge commit.
4. Undo that merge the same way, with `ORIG_HEAD`.
5. Check that `main` is back on "Add logging", `experiment` is unchanged and the tree is clean.

## What just happened

Each of pull, merge, rebase and reset writes `ORIG_HEAD` just before it moves HEAD. One bookmark, overwritten each time, so use it right away or fall back to the reflog.
