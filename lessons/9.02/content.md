`git commit --amend` replaces the newest commit with a new one. Run it with nothing staged and the new commit has the same files; the editor opens with the old message so you can fix it. Give the message on the command line to skip the editor:

    git commit --amend
    git commit --amend -m "New message"

Because the id changes, amend is only for commits you have not shared yet. If the commit is already on a remote, leave it alone or fix it with a new commit.

## Try it

1. Read the last three commits in the history. The newest message has a typo: "contcat".
2. Amend the newest commit so its message reads `Add contact page`.
3. Read the history again and compare the ids: the newest one changed, the one below it did not.

## What just happened

The graph shows the old commit ghosted and the replacement in its place, with the same parent. Nothing happened to your files: the amend reused the snapshot of the old commit.
