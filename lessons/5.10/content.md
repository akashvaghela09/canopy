Branch names are labels, so renaming one is cheap: no commit changes.

```
git branch -m <new-name>
```

renames the branch you are on.

```
git branch -m <old-name> <new-name>
```

renames another branch. If a branch with the new name already exists, git refuses; `-M` forces the rename and the existing branch of that name is lost.

## Try it

1. Check which branch you are on. Someone named it `new-stuff`, which says nothing about what it holds. Look at its commit.
2. Rename the current branch to `river-walk`.
3. There is also a branch called `tmp`. Rename it to `archive/lake-draft` without switching to it.
4. List the branches with their tips and compare the short ids with the ones from before.

## What just happened

Two labels changed their text. HEAD still points to the same commit, now under the name `river-walk`, and `tmp`'s commit did not move either. On a shared repo a rename is a local change until you push it; section 7 covers the remote side.
