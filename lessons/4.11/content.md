This lesson deletes untracked files from disk; git has no copy of them, so they are gone for good.

Over time a project folder collects files git does not know about: scratch notes, downloads, temporary folders. The status lists them as untracked. `git clean` deletes them, with options that control how far it goes:

- `git clean -n`: dry run. Prints what would be deleted and deletes nothing.
- `git clean -f`: delete untracked files. Git insists on `-f` (force) or `-n`.
- `-d`: also delete untracked folders.
- `-x`: also delete files that `.gitignore` ignores. Usually you do not want this; ignored files are often build output or local settings you rely on.

Make the dry run a habit: `-n` first, read the list, then the same command with `-f`.

## Try it

1. Check the status. There is an untracked file and an untracked folder. Ignored files do not appear.
2. Run `git clean -n`, then `git clean -nd`. Compare the two lists.
3. Run `git clean -fd`.
4. Check the status again, and list the folder to confirm the ignored files are still there.
5. Answer the question in the lesson panel.

## What just happened

Clean deletes only what git does not track and does not ignore. Tracked files are never touched; ignored files are kept unless you add `-x`. The dry run costs nothing and shows exactly what `-f` will do.
