Two questions about missing files. Someone removed a config file a while ago, and nobody remembers its name or who did it. And `docs/usage.md` seems to have a short history; was it called something else before? Filter the log by the *kind* of change a commit made to a file:

```
git log --diff-filter=D --summary
git log --diff-filter=R --summary
git log --oneline --follow -- docs/usage.md
```

`--diff-filter=` takes letters: `A` added, `D` deleted, `R` renamed, `M` modified. `--summary` adds "delete mode", "create mode" and "rename" lines under each commit, so you see the file names without the full diff. For one file, `--follow` continues past the commit that renamed it.

## Try it

1. List the commits that deleted files, with `--summary`. Find the config file and who removed it.
2. Log `docs/usage.md` with and without `--follow`. Count the commits each time and find the old name.
3. List the rename commits with `--diff-filter=R --summary` to see the same rename from the other side.
4. Answer the questions in the lesson panel.

## What just happened

Git stores snapshots, not renames or deletions; it works them out by comparing each commit with its parent. `--diff-filter` asks git to classify that comparison and keep only the kinds you name, and `--follow` uses the rename detection to keep walking a file's history under old names.
