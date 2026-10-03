When a branch is strictly ahead, git fast-forwards by default and the history ends up a straight line. You lose one piece of information: that these commits were once a branch. Many teams want to keep that: a merge commit per feature makes the history read as a list of features, and it gives you one commit to undo if the feature has to go.

```
git merge --no-ff <branch>
```

makes a merge commit even when a fast-forward was possible. The merge commit's first parent is the old tip of `main`, its second parent is the branch tip.

## Try it

1. Draw the history. `login` sits two commits ahead of `main`; nothing has happened on `main` since.
2. Merge `login` into `main` with `--no-ff`. Give it a message or keep the prepared one.
3. Draw the history again and compare it with the fast-forward from 6.01.
4. Answer the question.

## What just happened

Instead of sliding the `main` label forward, git created a new commit with two parents. The graph shows a small loop: the branch leaves `main` and comes back. The two login commits are still exactly where they were.
