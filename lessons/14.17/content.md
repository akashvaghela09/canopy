`git diff` picks a comparison based on its arguments. Underneath are three plumbing commands, each comparing two fixed things and printing raw lines: old mode, new mode, old blob, new blob, status, path.

- `git diff-files`: index against working tree (what `git diff` shows),
- `git diff-index --cached HEAD`: HEAD against index (what `git diff --staged` shows),
- `git diff-index HEAD`: HEAD against working tree,
- `git diff-tree -r A B`: one commit's tree against another's (what `git diff A B` shows).

A blob id of all zeros means "not yet hashed": the working-tree file differs but git did not store it.

## Try it

1. The repository has one file changed and staged, and another changed but not staged. Run `git diff-files` and read which path it lists.
2. Run `git diff-index --cached HEAD`. A different path.
3. Run `git diff-index HEAD` without `--cached`. Both.
4. Run `git diff-tree -r HEAD~1 HEAD`. The file changed by the last commit.
5. Answer the questions in the lesson panel.

## What just happened

Each porcelain diff is one of these comparisons with pretty output. Knowing which two things are compared is what the three-area panel in earlier lessons showed: working tree, index, HEAD.
