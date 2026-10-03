A branch with many small commits ("wip", "fix typo", "try again") can be merged as **one** commit:

```
git merge --squash <branch>
```

Git combines everything the branch changed since the merge base and puts the result in your staging area. It does not commit. The state is like the one after a soft reset: the work is staged, waiting for you to write one message and commit.

The commit you then make is an ordinary commit with one parent. It is not linked to the branch. The branch's own commits stay where they are, outside `main`'s history.

## Try it

1. Draw the history. `export` has three commits that together add a CSV export.
2. On `main`, run `git merge --squash export`, then check the status.
3. Commit the staged result with the message `Add CSV export`.
4. Try to delete `export` the normal way and read the refusal. Answer the question.
5. Delete the branch anyway; its work is in `main` now.

## What just happened

On the graph the new commit sits on `main` with a single incoming line; nothing connects it to the `export` lane. That is why git calls the branch unmerged: it checks whether the branch's commits are ancestors of `main`, and they are not. Only the changes made it across.
