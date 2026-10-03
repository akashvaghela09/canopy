A commit saves the staging area as a permanent snapshot, with a message attached.

    git commit -m "Add the introduction"

`-m` gives the message on the command line. Say what the change does, in a few words. Without `-m`, git opens an editor and asks for the message.

## Try it

1. Stage `intro.txt` and check the status.
2. Commit it with a message.
3. Check the status again: `chapter1.txt` is still untracked. It was never staged, so the commit does not contain it.

## What just happened

A new dot appeared on the graph and `main` moved onto it. The commit holds `README.md` (from the first commit) and `intro.txt`. Untracked files are never swept up by accident: only what you stage goes in.
