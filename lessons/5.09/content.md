A branch is **merged** into the current branch when every commit on it is already reachable from where you are. Its label then points somewhere inside your history, and it has nothing you lack.

```
git branch --merged
git branch --no-merged
```

split the branches into those two groups, judged from the branch you are on.

```
git merge-base A B
```

prints the **merge base**: the newest commit that both branches can reach. Here, that is where `herbs` forked off.

```
git diff A...B
```

with three dots compares the merge base with `B`. That shows only what `B` changed since the fork, leaving out everything `A` did in the meantime. (With two dots, or a plain pair of names, diff compares the two tips directly.)

## Try it

1. List the merged branches, then the unmerged ones.
2. Find the merge base of `main` and `herbs`, and locate it in the graph.
3. Show a stat diff of `main...herbs`, then of `main..herbs`, and compare which files each one lists.
4. Answer the questions in the lesson panel.

## What just happened

`labels` and `pests` are merged for two different reasons: `labels` sits on an old commit of `main`, and `pests` was merged in with a merge commit. `herbs` has two commits `main` cannot reach, so it is not merged. The merge base is where the three-dot diff starts, which is why it lists only the herbs file.
