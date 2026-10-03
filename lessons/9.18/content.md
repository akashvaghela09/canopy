`edit` (or `e`) in the todo list makes the rebase stop right after replaying that commit, with HEAD on it. You can then change files and amend the commit, or even add new commits, before telling git to go on:

    git rebase --continue

Anything you amend in becomes part of that commit; the commits after it are replayed on top of the new version.

## Try it

1. Read the history. "Add README" is three commits down, and the README it added has no Usage section.
2. Start an interactive rebase that covers that commit and the two after it. Mark the "Add README" line `edit`, save.
3. Git stops with HEAD on "Add README". Check the status. Add these lines to the end of `README.md`:

       ## Usage

           tool <file>

4. Stage the file and amend the commit, keeping its message.
5. Continue the rebase. Read the history: "Add README" now contains the Usage section, and the two commits after it were rebuilt on top of it.

## What just happened

While stopped, you were in a detached state on the half-built copy; `main` only moved when the rebase finished. `edit` is the general tool: the next lessons use it to split a commit in two.
