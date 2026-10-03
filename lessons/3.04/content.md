Often you care about one file: when did it change, and what exactly changed each time? Give `git log` a path and it keeps only the commits that touched that file:

```
git log --oneline -- pages/menu.md
```

The `--` separates options from paths. Add `--stat` to see how many lines each commit changed, or `-p` to see the full patch for each commit.

There is a catch. A renamed file looks like a new file to git, so a plain path log stops at the rename. `--follow` tells git to keep going and track the file under its old name too.

## Try it

1. List the commits that touched `pages/menu.md`, one per line. Count them.
2. Add `-p` and read what each commit did to the menu.
3. Run the list again with `--follow`. More commits appear. Count them.
4. Answer the questions in the lesson panel.

## What just happened

The menu started life as `menu.md` in the repo root and was moved into `pages/` later. Without `--follow`, git shows only the history of the path you named. With `--follow`, it notices the rename and continues into the old path.
