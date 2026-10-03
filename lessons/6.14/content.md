This lesson throws away a merge commit with a hard reset; any uncommitted changes would go with it.

You merged a branch and then found out it was not ready. If nobody else has seen the merge yet, the cleanest fix is to make it never have happened. A merge commit's first parent is the commit your branch was on before the merge, so moving the branch back there removes the merge:

```
git reset --hard HEAD~1
```

This only works for a real merge commit. After a **fast-forward** there is no merge commit: `HEAD~1` is usually one of the branch's own commits, and resetting to it would leave you somewhere in the middle of the other branch. Check the history before you reset. (Section 10 teaches a method that works for both.)

## Try it

1. Draw the history. `newsletter` and `main` have diverged.
2. Merge `newsletter` into `main`. It goes through without conflict.
3. Read the history: HEAD is the merge commit and `HEAD~1` is "Add contact page".
4. Undo the merge with the hard reset shown above.
5. Draw the history again: `main` is back where it was, and `newsletter` still has its commits.
6. Answer the question.

## What just happened

The `main` label moved back one step along its first parent. The merge commit has no branch pointing at it any more, so it dropped off the graph. Nothing on `newsletter` changed; you can merge it again later, once it is ready.
