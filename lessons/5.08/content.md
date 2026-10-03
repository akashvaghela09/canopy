Once branches diverge, the useful question is "what is on this branch that is not on that one?" The log answers it with a **range**:

```
git log A..B
```

lists the commits reachable from `B` that are not reachable from `A`. Read it as "B minus A". `git log main..herbs` is "what herbs has that main lacks", and swapping the names asks the opposite question.

```
git log --left-right A...B
```

with three dots lists the commits on either side but not on both, and marks each with `<` (reachable from `A` only) or `>` (reachable from `B` only).

The diff command accepts the same two-dot spelling, but it compares two snapshots and says nothing about commits. `log` with a range lists the commits between them.

## Try it

1. Draw the graph with all branches, and find where `herbs` forked off from `main`.
2. List the commits that are on `herbs` but not on `main`, in compact form.
3. List the commits that are on `main` but not on `herbs`.
4. Run the three-dot form with `--left-right` and compare the arrows with the two lists.
5. Answer the questions in the lesson panel.

## What just happened

Each range picks out part of the graph. In `main..herbs` git starts at `herbs`, walks back through parents, and stops at anything `main` can reach. The merge commit on `main` counts as a commit on main's side, like any other.
