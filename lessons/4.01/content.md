This lesson throws away uncommitted edits to one file; those edits cannot be recovered afterwards.

Sometimes you edit a file, decide it was a bad idea, and want it back the way it was in the last commit. Git can do that in one step:

```
git restore <file>
```

puts the file on disk back to the version in the staging area. When nothing is staged for that file, as here, that is the version from the last commit. Your edits are gone. Git does not keep them anywhere, so look before you do it.

Only the file you name is touched. Other modified files stay as they are.

## Try it

1. Check the status. Two files have been modified: `notes.txt` and `todo.txt`.
2. Look at the changes in `notes.txt`. Someone pasted a block of junk into it. The changes in `todo.txt` are good and should stay.
3. Run `git restore notes.txt`.
4. Check the status and the diff again. Only `todo.txt` should still show as modified.

## What just happened

In the three-area panel, `notes.txt` in the working tree now matches the staging area and HEAD again. Nothing was committed and nothing moved in the graph; restore only rewrote the file on disk. Before you run it, use the diff to be sure the edits are really ones you want to lose.
