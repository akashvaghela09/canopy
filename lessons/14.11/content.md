History is a directed graph: each commit points at its parents. Every question about history is a question about **reachability**: which commits can you get to by following parent links from a starting point?

`git rev-list` is the engine that answers it; `git log` is `rev-list` plus formatting.

- `git rev-list --count <rev>`: how many commits are reachable,
- `git rev-list A..B`: reachable from B but not from A; `--all` starts from every ref,
- `git rev-list --parents <rev>`: each commit followed by its parent ids,
- `git rev-list --topo-order <rev>`: parents never printed before their children,
- `git rev-list --ancestry-path A..B`: only commits on a path from A to B.

## Try it

1. Draw the graph in your head from the graph panel, then count: all of `main`; only `wip`'s side (`main..wip`); everything (`--all`).
2. `git rev-list --parents main` and find the line with three ids. That is the merge.
3. Compare `git rev-list --count 2728b4f..main` with the same range under `--ancestry-path`. The difference is a commit that is newer than `2728b4f` but not descended from it.
4. Answer the questions in the lesson panel.

## What just happened

`A..B` does not mean "between A and B in time". It means "reachable from B, minus reachable from A", which is why a side branch can show up in the range. `--ancestry-path` is the strict version.
