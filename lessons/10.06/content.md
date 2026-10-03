While tidying up, `feature/drafts` was deleted with `-D` and git did not argue, because `-D` means "I know it is unmerged". The branch had three commits nobody else has. A branch is only a name for a commit, so deleting it deletes the name. The commits stay, and the reflog of HEAD still lists them because you were on that branch when you made them.

The recovery is two steps: find the tip, then give it a name again.

```
git branch feature/drafts <id>
```

Read the reflog carefully. Each line shows where HEAD was *after* the action, so the id you want is on a "commit:" line from the branch, not on the "checkout: moving from feature/drafts to main" line, which already shows `main`'s commit.

## Try it

1. List the branches. `feature/drafts` is gone; `feature/comments` and `main` remain.
2. Print the reflog and find the last commit made on `feature/drafts` ("Add draft autosave").
3. Create `feature/drafts` again at that commit.
4. Draw the graph: the three gray draft commits are back in color, on their own branch.

## What just happened

`branch -D` also printed the tip's id when it deleted the branch ("was ..."); if that is still on screen, the id is all you need. The branch's own reflog was deleted with it, but HEAD's reflog is separate and kept every move. If a long time had passed and HEAD's reflog had expired, the next lessons show `fsck` as the last resort.
