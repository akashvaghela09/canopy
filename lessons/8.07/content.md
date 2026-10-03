An old stash can be awkward to pop: `main` has moved on, and the stashed lines now conflict with newer commits. There is a cleaner way than fighting the conflict. Git can create a branch at the commit the stash was made on, apply the stash there, and drop the entry:

```
git stash branch <name>            from the newest stash
git stash branch <name> stash@{2}  from a named entry
```

Because the branch starts where the stash started, applying it works without conflicts, as long as your working tree is clean. You then merge or rebase that branch as a normal piece of work.

## Try it

1. Look at the log and at the stash: the stash was made on the first commit, and the newer commit on `main` changed the same function.
2. Run `git stash branch retry-limit`. Read the output: the branch was created, the stash applied, and the entry dropped.
3. Draw the graph with all branches. You are on `retry-limit`, one commit behind `main`, with the stashed change in your working tree.
4. If you like, commit the change on this branch.

## What just happened

`stash branch` turned a stale stash into a proper branch with no conflict, because it applied the change in the context it was written for. Reconciling it with `main` is now a merge between two branches, which is a problem you already know how to handle.
