After a fetch, the teammate's commits sit on `origin/main`. To get them onto your `main`, merge that branch in. `origin/main` is a branch like any other as far as merging is concerned:

```
git merge origin/main
```

If you have no commits of your own, the merge is a fast-forward: `main` moves up to `origin/main`. If you both committed, git makes a merge commit with two parents, exactly like merging two local branches.

## Try it

1. Sam already pushed a new trail. Fetch, then look at the graph: `origin/main` is ahead of `main`.
2. Run `git merge origin/main`. Watch `main` move up. No new commit was made.
3. Now make a commit of your own: add a line to `README.md` and commit it.
4. Press **Teammate pushes a fix**. (If you pressed it earlier already, press it once more: Sam has one more change.) Fetch again. The graph shows the two branches diverging.
5. Run `git merge origin/main` once more. This time git creates a merge commit. Draw the graph and find its two parents.

## What just happened

Fetch brought the commits in; merge joined them to your branch. The first time that was a fast-forward, the second time a real merge. Nothing has gone back to the remote yet: `origin/main` in your graph is still at Sam's last push, and your commits exist only in your clone. Pushing comes in 7.07.
