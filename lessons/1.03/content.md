A repository (repo for short) is a folder that git watches. Everything git knows about that folder, every saved version and every setting, lives in one hidden sub-folder called `.git`. A folder plus its `.git` is a repo.

You turn an ordinary folder into a repo with one command, run inside that folder:

    git init

It creates `.git` and nothing else. Your files are not touched, and nothing is saved yet. Canopy sets git up to call the first line of history `main` (on other computers it may be called `master`). You will see that name in the graph once there is a commit.

## Try it

1. Move into the `garden` folder.
2. Run `git init`.
3. List the folder's contents, including hidden items. Find the new folder and answer the question with its name.

## What just happened

The graph is empty and says "no commits yet": the repo exists but holds no saved versions. Deleting `.git` would turn `garden` back into a plain folder. Never edit anything inside `.git` by hand; git manages it for you.
