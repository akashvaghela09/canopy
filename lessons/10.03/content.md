A hard reset to the wrong place took three commits off `main`: rate limiting, request logging and the health endpoint. The fix is the same tool pointed the other way. A reset moves a branch to any commit, and the reflog knows the commit you want.

```
git reset --hard HEAD@{1}
```

moves the branch back to where HEAD was one move ago, and makes the staging area and the files match. Read the reflog before you run it: you want the entry *before* the bad reset, which is normally `HEAD@{1}` but is further down if anything moved HEAD since.

## Try it

1. Read the history and the status. Three commits are missing from the log (the graph still shows them in gray); the tree is clean.
2. Print the reflog and find the entry just before "reset: moving to HEAD~3".
3. Hard-reset `main` to that entry.
4. Confirm the history ends with "Add health endpoint" again.

## What just happened

The three commits never left the repository. Only the branch label moved, and moving it back makes them reachable again. The same move works with the commit id instead of `HEAD@{1}`, or with `main@{1}`: any name for that commit will do. Cherry-picking the three commits would also bring the work back, but as copies with new ids; moving the label back keeps the originals.
