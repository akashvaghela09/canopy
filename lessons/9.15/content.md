Amend fixes the newest commit. For an older message, use an interactive rebase and the command `reword`:

    reword a1b2c3d Add paser module

Change `pick` to `reword` (or `r`) on that line and save. When the replay reaches the commit, git opens the editor with its message; fix it, save, and the rebase finishes on its own.

## Try it

1. Read the history. "Add paser module" is three commits down.
2. Start an interactive rebase that covers that commit and everything after it.
3. Mark that line `reword`, keep the others as `pick`, save. In the message editor, change the message to `Add parser module` and save.
4. Read the history again. The message is fixed, and the two commits after it have new ids too.

## What just happened

A reworded commit is a new commit, so every commit after it had to be copied as well: their parent changed. The graph shows all three originals ghosted, even though only one message changed. That is the cost of editing deep history, and why it is only done before sharing.
