You already know how to see what changed in your working tree. The same command compares any two commits:

```
git diff <old> <new>
```

prints what you would have to change to get from the first commit to the second. Lines with `-` exist only in the old commit, lines with `+` only in the new one.

Any commit name works: ids, tags, `HEAD~2`. `git diff A..B` means the same as `git diff A B`. Swap the two and every `+` becomes a `-`.

## Try it

1. Run `git diff HEAD~2 HEAD` and read which files it covers.
2. Run `git diff v1.0 HEAD` to see everything that changed since the launch tag. Find the baguette line.
3. Run `git diff HEAD v1.0` and notice the signs flip.
4. Answer the questions in the lesson panel.

## What just happened

A diff between two commits does not care how many commits lie between them. It compares the two snapshots and reports the net difference. That is why a line that was changed and then changed back does not show up at all.
