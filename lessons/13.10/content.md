rerere stands for "reuse recorded resolution". When it is enabled, git remembers how you resolved each conflict hunk, and the next time it sees the same conflict it applies the same resolution for you. That matters when the same conflict comes back: a long rebase you restart, a branch you merge into several places, or a merge you undo and redo.

- `git config rerere.enabled true` turns it on (globally in real life; in this repo here).
- `git rerere status` lists conflicted paths rerere is tracking; `git rerere diff` shows your resolution so far.
- `git rerere forget <path>` throws away a recorded resolution that turned out wrong.

rerere resolves the working tree file, but it does not stage or commit for you. You still review, stage and commit.

## Try it

`main` and `feature` both changed the `timeout` line in `config.txt`.

1. Enable rerere in this repo.
2. Merge `feature`. Resolve the conflict so the line reads `timeout = 90`, stage the file, run `git rerere status` and `git rerere diff`, then commit the merge.
3. Pretend the merge was a mistake: move `main` back one commit, discarding the merge.
4. Merge `feature` again. Read the output carefully, look at `config.txt`, then stage it and commit. Answer the question in the lesson panel.

## What just happened

The first resolution was recorded under `.git/rr-cache`. The second merge produced the same conflict, git recognised it and wrote your resolution into the file, leaving you only the review. The recordings are keyed on the conflict text, so they work across branches and even across rebases.
