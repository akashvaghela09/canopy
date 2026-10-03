Push is the opposite of fetch: it sends your commits to the remote and moves the remote's branch to match yours.

```
git push                   current branch to its remote counterpart
git push origin main       spelled out: this remote, this branch
```

A push only succeeds when the remote branch can fast-forward to your commit, that is, when you already have everything the remote has. Here nobody pushed since you cloned, so the push goes through.

## Try it

1. Create a new file, `trails/meadow.md`, with a title line and a distance line. Commit it.
2. Look at the graph: `main` is one commit ahead of `origin/main`.
3. Run `git push`. Read the output: it names the remote and shows `main -> main`.
4. Look at the graph again. `origin/main` caught up with `main` without a fetch, because the push itself told your clone where the remote now is.
5. Press **Teammate pulls**. Switch the graph to the Teammate repo: Sam now has your commit.

## What just happened

Your commit travelled from your clone to `origin.git`, and from there into Sam's clone when Sam pulled. That is the whole loop of team work with git: commit locally, push to the shared remote, and everyone else pulls.
