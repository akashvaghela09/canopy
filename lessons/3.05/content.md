`git log` lists commits. `git show` opens one of them.

```
git show <commit>
```

prints the commit's author, date, message and the full patch: every line it added or removed. Add `--stat` to get only the list of files and how many lines changed in each.

`git show` can also print a single file *as it was* in that commit, without touching your working tree:

```
git show <commit>:<path>
```

The `<commit>` can be a short id from the log, or a tag name such as `v0.1`.

## Try it

1. Find the id of the commit "Add opening hours to index" in the compact log.
2. Run `git show --stat` on it, then `git show` without `--stat`, and compare.
3. Print the menu as it was at tag `v0.1`: `git show v0.1:menu.md`.
4. Answer the questions in the lesson panel.

## What just happened

A commit is a full snapshot plus a message. `git show <commit>` shows the snapshot as a change against its parent; `git show <commit>:<path>` reaches into the snapshot and prints one file. Nothing in your working tree changed.
