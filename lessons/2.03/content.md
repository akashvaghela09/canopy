Git keeps three versions of your project in view at once:

- the **working tree**: the files on disk that you edit,
- the **staging area**: the version you have marked for the next commit,
- **HEAD**: the last commit.

Staging takes a copy of a file *at that moment*. If you edit the file again afterwards, the staging area still holds the older copy. That is why a single file can appear twice when you check the status.

## Try it

1. `todo.txt` was staged, then edited again. Check the status of the repo and find `todo.txt` in both lists.
2. Watch the three-area panel: the staging column and the working tree column hold different text for the same file.
3. Answer the question in the lesson panel.
4. Commit `todo.txt` so the commit includes "buy bread".

## What just happened

A commit is made from the staging area, not from the files on disk. If you had committed before staging again, "buy bread" would have stayed behind as an uncommitted change.
