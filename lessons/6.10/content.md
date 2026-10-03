Not every conflict is worth resolving right now. Maybe the branch is not ready, maybe you merged the wrong one, maybe you want to ask the author first. While a merge is paused you can back out:

```
git merge --abort
```

Git restores your files and staging area to the state before the merge and forgets the merge. Nothing was committed, so there is nothing left behind: no commit, no markers, no "merging" note in the status.

## Try it

1. Draw the history. Both `experiment` and `main` changed the toast line in `menu.md`, in different ways.
2. Merge `experiment` and hit the conflict. Check the status.
3. Decide this is not the moment. Run `git merge --abort`.
4. Check the status and the history: clean, and `main` has not moved.

## What just happened

The graph never showed a new commit; it only went from "merge in progress" back to normal. `--abort` works at any point of a paused merge, even after you have started editing a conflicted file. Those edits are thrown away with the rest of the attempt. Start merges with a clean working tree: if you had uncommitted changes before merging, git may not be able to restore them.
