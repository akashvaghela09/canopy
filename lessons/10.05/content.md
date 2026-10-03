A rebase was run on `feature/search` with the wrong base: it now sits on top of `wip-styles`, an unfinished styling branch, instead of `main`. The rebase completed without conflicts, so there is nothing to abort. It still is not lost.

A rebase writes new commits and then moves the branch label onto them. The old commits stay in the repository, and the branch's own reflog records the move as one entry:

```
git reflog show feature/search
```

The top line reads "rebase (finish): ...". The line under it is the branch tip from before the rebase. Reset the branch to it:

```
git reset --hard feature/search@{1}
```

`ORIG_HEAD` also points there, until the next merge, pull, rebase or reset overwrites it. The reflog entry keeps working either way. HEAD's own reflog has a line for every copied commit, so `HEAD@{1}` is one of the copies; the branch's reflog is the easier one to read here.

## Try it

1. Draw the graph. `feature/search` hangs off `wip-styles`; it should hang off "Add login page" on `main`. In the graph the three original commits are still there, drawn dashed and hollow with a dotted arrow to their copy: rewritten originals.
2. Print the reflog of `feature/search` and find the pre-rebase tip.
3. Hard-reset the branch to it.
4. Draw the graph again. The three search commits are back in their original place, with their original ids.

## What just happened

Rebase does not edit commits; it copies them and repoints the branch. Pointing the branch back at the originals undoes everything. The copies are now the ones only the reflog remembers (gray in the graph) until it forgets them.
