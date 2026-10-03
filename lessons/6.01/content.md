Merging brings the work of one branch into another. You stand on the branch that should receive the changes and name the branch to bring in:

```
git merge <branch>
```

The simplest case is when the branch you are merging is strictly ahead: every commit on your branch is already part of it. Then there is nothing to combine. Git moves your branch label forward to the other branch's tip and reports **Fast-forward**. No new commit is made.

## Try it

1. You start on `add-soup`. List the commits it has that `main` does not, and answer the first question.
2. Switch to `main`. Check which branches are merged into it: `add-soup` is not, yet.
3. Run `git merge add-soup` and read the output.
4. Draw the history. Both labels now sit on the same commit. Answer the second question.

## What just happened

On the graph, `main` slid forward along commits that already existed. Nothing was created; a fast-forward only moves a label. The next lesson covers what happens when both branches have new commits.
