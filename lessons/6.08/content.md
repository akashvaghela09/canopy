A three-way merge combines changes from both sides. When the two sides changed the **same lines** differently, git cannot know which version is right. It stops, reports a **conflict**, and asks you to decide.

Nothing is committed yet. The merge is paused. In the conflicting file, git writes both versions between markers:

```
<<<<<<< HEAD
the line as it is on your branch
=======
the line as it is on the branch you are merging
>>>>>>> new-title
```

`HEAD` labels your side, the branch you were on when you ran the merge. The name after `>>>>>>>` is the branch being merged in. The status calls such a file "both modified" and lists it under "Unmerged paths".

## Try it

1. Draw the history. Both `main` and `new-title` changed the heading in `index.html`.
2. Merge `new-title` into `main` and read what git prints.
3. Check the status and find the unmerged file.
4. Open `index.html` in the files panel or print it. Find the markers.
5. Look at the diff too: during a conflict it has two columns of `+`, one per side. ` +` lines come from your side, `+ ` lines from the other branch, and `++` lines (the markers) are in neither.
6. Answer the questions. Leave the merge as it is; resolving comes next.

## What just happened

The graph shows no new commit: the merge is in progress, not done. The diff panel's three-way view shows ours, theirs and the base side by side. The file on disk contains both versions and is not valid HTML until you fix it.
