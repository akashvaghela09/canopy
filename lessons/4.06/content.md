`git reset` is often described as "undo a commit". What it really does is smaller and more precise: it **moves the current branch label** to another commit. HEAD follows the branch, so HEAD moves too.

What happens to the staging area and your files depends on an option (soft, mixed, hard), which the next lessons cover one by one. With no option, reset moves the branch and resets the staging area to match the new commit (so nothing is staged), but **leaves your files on disk exactly as they are**.

This lesson is guided: follow the commands and watch the graph.

## Try it

1. Draw the graph: `git log --oneline --graph`. `main` sits on "Add salt to soup".
2. Run `git reset HEAD~1`.
3. Draw the graph again. `main` and HEAD moved one commit back, and "Add salt to soup" is no longer listed.
4. Run `git status` and look at `soup.md` in the three-area panel.
5. Answer the questions in the lesson panel.

## What just happened

The branch label moved; the file did not. The salt line is still in `soup.md` on disk, now shown as an unstaged change, because the commit that held it is no longer where `main` points. The commit itself still exists in the repo; it is only unreachable, and section 10 shows how to find such commits again.

One warning for later: moving a branch backwards rewrites its history. On a branch you share with other people (section 7) that causes trouble, so there reset is for local commits only.
