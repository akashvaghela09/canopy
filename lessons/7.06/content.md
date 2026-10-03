Fetch then merge is such a common pair that git has one command for it:

```
git pull
```

`git pull` fetches from the remote, then merges the remote-tracking branch of your current branch (`origin/main` for `main`) into your branch. The result is the same as the two steps from the last lesson.

One wrinkle in modern git. When your branch and the remote have both moved, plain `git pull` fetches, then stops and prints a hint: it wants you to say how to join the two histories (merge, rebase, or only fast-forward). Rebasing comes much later in this course. For now the answer is merging. The hint also mentions `--global`. Skip that here: it would change the setting for every lesson. Choose for this repository only:

```
git pull --no-rebase            merge, this time only
git config pull.rebase false    merge from now on, in this repo
```

When a fast-forward is possible, `git pull` does it without asking.

## Try it

1. Sam already pushed a new trail. Run `git pull`. Read the output: the fetch lines first, then "Fast-forward". Check the graph.
2. Make a commit of your own: add a line to `README.md` and commit it.
3. Press **Teammate pushes a fix**, then run `git pull` again. (If you pressed the button earlier already, press it once more first: Sam has one more change.) Read the hint and the final `fatal:` line. Nothing was merged, but look at the graph: `origin/main` did move, because the fetch half ran.
4. Pull again in a way that merges. Draw the graph: a merge commit, as in the last lesson.
5. Answer the question.

## What just happened

Pull is fetch plus merge. The first round was a fast-forward, so there was nothing to decide. In the second round the histories had diverged, git asked how to join them, and you chose a merge. The hint about `pull.rebase` is git being careful, not an error in your repo.
