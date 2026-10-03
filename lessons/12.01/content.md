Most teams work the same way: every task gets its own short-lived branch. The branch exists for hours or days, not months. When the task is done it is merged into `main` and deleted. Then the next task starts from a fresh branch.

The habit has a rhythm:

1. Start from an up-to-date `main`.
2. Create a branch named after the task, for example `feature/search` or `fix/login-typo`.
3. Make one or more small commits.
4. Publish the branch so others can see it.
5. Merge it into `main` with a merge commit, so the graph keeps the shape of the task.
6. Push `main`, then delete the branch locally and on origin.

A branch that is deleted after merging is not lost: its commits are in `main`. Deleting keeps the branch list short and tells everyone the task is finished.

Some teams squash or rebase at step 5 instead of making a merge commit (12.06 shows that style). The cycle is the same.

## Try it

Lantern needs a search command. Run one full cycle:

1. Create a branch called `feature/search` and switch to it.
2. Add a file `src/search.js` containing a function `search(notes, word)` that returns the notes whose text contains the word. Commit it.
3. Publish the branch to origin.
4. Switch back to `main` and merge the branch with a merge commit.
5. Push `main`.
6. Delete `feature/search` locally and on origin.

## What just happened

Look at the graph: `main` has a merge bubble that shows where the search feature came in, and the branch label is gone. The graph for origin shows the same shape. Anyone who clones now gets the feature without ever seeing the branch.
