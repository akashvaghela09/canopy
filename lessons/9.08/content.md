A normal commit has one parent, so "the change it made" is clear. A merge commit has two, and git refuses to cherry-pick it until you say which parent to compare against:

    git cherry-pick -m 1 <merge-commit>

`-m 1` means the first parent: the branch that was merged into. The change you get is everything the merge brought in from the other side, as one commit. You met the same option when reverting a merge.

## Try it

1. Read the graph. `main` ends in a merge of `feature-export`; `release` branched off before that and has one commit of its own.
2. Switch to `release` and try to cherry-pick the merge commit without `-m`. Read the error.
3. Cherry-pick it again with `-m 1`.
4. Check the files: `release` now has `export.js`, but not the docs change that `main` made on its own side.
5. Answer the question.

## What just happened

The copy on `release` is an ordinary one-parent commit. Its message still says "Merge branch ..."; add `-e` to the pick if you want to reword it. Picking merges this way is rare; most teams cherry-pick the individual commits instead, which is why this lesson is optional.
