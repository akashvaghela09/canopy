Large work is often split into a **stack**: `part1` on `main`, `part2` on `part1`, `part3` on `part2`, each a small review. When `main` moves, rebasing `part3` alone leaves `part1` and `part2` pointing at the old commits. `--update-refs` moves every branch that points into the rebased range:

    git rebase --update-refs main

Git notices which commits in the replayed range carry branch labels and moves each label onto that commit's copy. With `-i`, you can see it in the todo list: an `update-ref refs/heads/part1` line after the commit that `part1` points to. Set `rebase.updateRefs` to `true` in your config to make this the default.

## Try it

1. Draw the graph: a stack of three branches, one commit each, built on an older `main`. `main` has one new commit.
2. On `part3`, rebase onto `main` with `--update-refs`.
3. Draw the graph again: all three branch labels moved with their commits, still one commit apart.

## What just happened

Without the option, `part1` and `part2` would have stayed on the ghosted originals, and you would have needed an `--onto` rebase for each of them. With it, one command moved the whole stack.
