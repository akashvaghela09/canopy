A paused merge is state inside `.git`, and you can read it like any other state. Four tools help when a conflict is bigger than one file.

- `git diff --name-only --diff-filter=U` lists the unresolved paths, one per line. (`U` is the status letter for unmerged.)
- `git ls-files -u` lists them with more detail: each file appears up to three times, as stage 1 (the base), stage 2 (ours) and stage 3 (theirs), each with its own blob id.
- `git log --merge` shows only the commits, from both branches, that touched the conflicted files. That is where to look for who changed what and why.
- `.git/MERGE_HEAD` is a file holding the id of the commit being merged in. Its presence is how git knows a merge is in progress, and `MERGE_HEAD` works as a name anywhere a commit id goes.

## Try it

1. Merge `search` into `main`. Two files conflict, though each side changed different lines: changes on touching lines also conflict.
2. List the unresolved paths with one of the first two commands.
3. Print `.git/MERGE_HEAD` and find that commit in the history.
4. Run `git log --merge --oneline` and count the commits it shows.
5. Answer the questions, then resolve both files however you see fit and commit the merge.

## What just happened

`MERGE_HEAD` is the other parent of the commit you are about to make, and `HEAD` is the first. When you commit, git reads `MERGE_HEAD`, writes a commit with both parents, and deletes the file. That deletion is what ends the "merging" state. `--abort` deletes it too, after putting your files back.
