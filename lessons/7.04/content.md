`git fetch` asks the remote for everything new and stores it in your clone. It updates the remote-tracking branches (`origin/main` and friends) and downloads the commits they need. It changes nothing else: your branches, your files and your staging area stay as they are.

```
git fetch                 from origin, the default remote
git fetch --all           from every remote
git fetch --prune         also forget remote branches that were deleted
```

Fetch is safe to run at any time. It is the "look, do not touch" half of staying in sync.

## Try it

1. Press **Teammate pushes two commits** in the lesson panel. Sam's clone commits and pushes to `origin`. Nothing changes in your clone yet; check the graph.
2. Run `git fetch`. Read what it printed: a line showing `origin/main` moving from one commit to another.
3. Look at the graph. `origin/main` moved; `main` did not.
4. List the commits that are on `origin/main` but not on `main` (a commit range). Answer the question.

## What just happened

Your clone now holds Sam's commits, but they are only reachable through `origin/main`. Your `main` still points where it did, and the files on disk are unchanged. Bringing fetched work into your branch is a separate step, and the next lesson's topic.
