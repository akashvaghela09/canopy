Git does not save files straight from disk. Between your **working tree** (the files on disk that you see and edit) and a commit sits the **staging area**: a waiting room where you put the exact changes you want in the next commit. A commit saves what is staged, and nothing else.

    git add intro.txt

That copies the current `intro.txt` into the staging area. The other files stay where they are.

## Try it

1. Check the status: three untracked files.
2. Stage only `intro.txt`.
3. Check the status again. `intro.txt` is now listed under "Changes to be committed"; the other two are still untracked.

## What just happened

Watch the strip under the graph: `intro.txt` moved from the working tree column into the staging column. Nothing has been committed. Staging is how you choose; committing is how you save. Keeping the two apart lets you make several changes and save them one at a time.
