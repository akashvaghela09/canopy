The last commit, "Add settings and debug output", bundled two files: `settings.json`, which belongs in the project, and `debug.log`, which does not. You want to redo that commit with only the settings file.

```
git reset <commit>
```

with no option is the same as `git reset --mixed <commit>`. Like `--soft` it moves the branch, but it also **resets the staging area to match that commit**, so nothing is staged any more: the changes from the undone commit are back in your working tree as unstaged changes. Your files on disk are not touched.

That makes mixed reset the right tool when you want to choose again what goes into the commit.

## Try it

1. Read the history and check what the newest commit contains.
2. Run `git reset HEAD~1`.
3. Check the status: both files are present but neither is staged.
4. Stage only `settings.json` and commit it, for example as "Add settings file".
5. Answer the question in the lesson panel.

## What just happened

Soft reset keeps what is staged; mixed reset unstages it. Everything else is the same: the branch moves, the files on disk stay. `debug.log` is now an untracked file and is no longer in the history of `main`, which is what you wanted.
