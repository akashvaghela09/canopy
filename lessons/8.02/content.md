Stashes pile up, and their default names all look alike: `WIP on main: <commit>`. To find the one you want, look inside:

```
git stash list                 every entry, newest first: stash@{0}, stash@{1}, ...
git stash show stash@{1}       which files that entry changes, and by how much
git stash show -p stash@{1}    the full diff
```

Without an entry name, `stash show` means `stash@{0}`, the newest.

## Try it

1. List the stashes. There are three, all made on the same commit, all with the same bland name.
2. Look at each one with `git stash show`. One of them touches `config.toml`. Answer the first question.
3. Show that entry as a diff and read the new value of `theme`. Answer the second question.

## What just happened

A stash entry is stored as a commit (two or three, in fact: one for the index, one for the working tree, and one for untracked files if you asked for them), so git can diff it like any other. `stash show` compares the entry with the commit it was made on, which is why the output looks like `git diff --stat` and `git diff`.
