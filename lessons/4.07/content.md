This lesson removes the two newest commits from the history of `main`; their changes are kept and recommitted.

You made two quick commits, "WIP login form" and "WIP login styles", while working. Before anyone sees them, you want them to be one tidy commit.

```
git reset --soft <commit>
```

moves the branch to that commit and **keeps everything else as it is**: the staging area and your files are untouched. All changes from the commits you stepped back over are therefore still staged, ready to be committed again.

## Try it

1. Read the history. The two WIP commits are the newest two.
2. Run `git reset --soft HEAD~2`.
3. Check the status. The form and the stylesheet are staged, as if you had never committed them.
4. Make one commit with the message "Add login form".

## What just happened

In the graph, `main` jumped back two commits and then forward onto your new commit. The two WIP commits are no longer on `main`. The content is identical to what you had; only the history is shorter. This is safe as long as the commits you squash were never shared.
