`log -S` finds *when* text appeared. Sometimes the question is *where* it is used right now, or where it was used in an old release. `git grep` searches tracked files, and takes a revision to search a snapshot of the past without checking it out:

```
git grep -n legacy_total v0.1
git grep -c TAX_RATE v1.0
git grep -l apply_discount v1.0
```

`-n` adds line numbers, `-c` counts matches per file, `-l` lists only file names. Without a revision it searches your working tree; with one, every result is prefixed by that revision. Limit it to a folder with `-- pricer`.

## Try it

1. Search `v0.1` for `legacy_total`. Which files mention it?
2. Count the lines mentioning `TAX_RATE` per file at `v1.0`.
3. Find the earliest release tag whose tree contains `apply_discount`: try `v0.1`, then `v0.2`, and so on.
4. Answer the questions in the lesson panel.

## What just happened

`git grep` reads directly from git's objects, so it is fast and works at any commit or tag. Pair it with `log -S`: one tells you the history of a name, the other its footprint at a point in time.
