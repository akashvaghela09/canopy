`git status` is the question you will ask git most often: "what is going on here?" It tells you which branch you are on, whether anything has been saved yet, and which files have changed since the last save. It never changes anything, so run it whenever you are unsure.

    git status

## Try it

1. Run `git status` in this fresh repo. Read it: no commits yet, nothing to commit.
2. Create a file called `plan.txt` with a line of text in it.
3. Run `git status` again. The file appears under a heading. Answer the question about it.

## What just happened

Git noticed a new file but is not tracking it yet. "Untracked" means: git knows the file exists, but it is not part of any saved version, and git will not include it until you say so. In the three-area panel the file sits in the working tree column (the files on disk), outside git's reach.
