A stash is applied like a merge: the stashed changes are combined with whatever the files look like now. If the same lines changed since the stash was made, you get an ordinary conflict, with the usual markers, and you resolve it the usual way.

One difference from a merge: when `git stash pop` runs into a conflict, it does **not** drop the entry. Git keeps it, in case the resolution goes wrong. Once you are happy, you drop it yourself.

## Try it

1. Look at the log: since the stash was made, a commit changed the greeting in `app.py`. Look at the stash to see that it changes the same line.
2. Pop the stash. Read the message: a conflict in `app.py`, and a note that the entry was kept.
3. Open `app.py` and resolve the conflict so the greeting line reads exactly `return 'Hello there, gardener!'`. Stage the file.
4. List the stashes: the entry is still there. Drop it.
5. Answer the question.

## What just happened

A stash conflict is resolved like any other: edit, stage. There is no `--continue` and no merge commit; the result is an ordinary staged change you can commit when ready. Dropping the entry is your job, because git cannot know whether your resolution kept what you needed.
