Plain `git diff` compares the working tree with the staging area, so it shows only what you have *not* staged yet. To see what you *have* staged, what the next commit would contain, compare the staging area with HEAD:

    git diff --staged

`--cached` is an older name for the same flag.

## Try it

1. `recipe.txt` was changed, staged, then changed again. Look at the plain diff: it shows only the second change.
2. Look at the staged diff: it shows only the first change.
3. Answer the questions.
4. Stage the file again, so that the plain diff shows nothing.

## What just happened

Two diffs for three areas: `git diff` is working tree versus staging, `git diff --staged` is staging versus HEAD. Before every commit, `git diff --staged` tells you exactly what you are about to save.
