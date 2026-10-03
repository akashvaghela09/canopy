Editing markers by hand is right when the answer is a mix. Often it is not: one side is simply correct. Then take that side whole:

```
git restore --ours <file>      # the version from your branch (HEAD)
git restore --theirs <file>    # the version from the branch being merged
```

followed by staging the file. The older `git checkout --ours <file>` and `--theirs` do the same.

Not every conflict is two edits to one line. Git also stops when:

- **deleted by them**: you changed a file the other branch deleted. To keep it, stage it; your version is already on disk. To accept the deletion, remove it with git.
- **deleted by us**: the other branch changed a file you deleted. Same choice, the other way round.
- **both added**: both branches created a file with the same name but different content. Pick a side or merge by hand, then stage it.

Whatever the kind, the ending is the same: the status shows no unmerged paths, and you commit.

## Try it

1. Merge `cleanup` into `main`. Check the status: four files, four different situations.
2. `styles.css`, both modified: keep `main`'s version.
3. `CHANGELOG.md`, both added: take `cleanup`'s version.
4. `old-notes.txt`, deleted by them: keep the file. Your edits on `main` are still wanted.
5. `legacy.py`, deleted by us: accept the deletion.
6. Check that nothing is unmerged, then commit the merge.

## What just happened

For git, "resolved" means "staged". Whether you edited, restored a side, kept a file or removed one, staging the path is what cleared it from the unmerged list. The merge commit records your decisions; the branch's own commits still hold the versions you turned down.
