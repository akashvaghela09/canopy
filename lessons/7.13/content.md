Branches on the remote do not disappear when you delete your local copy. Deleting on the remote is a push:

```
git push origin --delete <branch>
```

That removes the branch from the remote and the matching `origin/<branch>` from your clone. Other people's clones still have their own `origin/<branch>` until they ask git to clean up:

```
git fetch --prune            fetch, and drop remote-tracking branches that no longer exist on the remote
git branch -dr origin/<name> drop one remote-tracking branch by hand
```

## Try it

1. List all branches. `winter-closures` is merged and finished; it exists locally, on the remote, and as `origin/winter-closures`. There is also an `origin/scratch` that Sam already deleted on the remote.
2. Confirm that with `git ls-remote origin`: no `scratch` there.
3. Delete `winter-closures` on the remote with `git push origin --delete winter-closures`. List all branches again and see what went with it.
4. Delete your local `winter-closures` branch.
5. Clean up the stale `origin/scratch` with `git fetch --prune`.
6. List all branches one last time: only `main` and `origin/main` remain (plus the `origin/HEAD` pointer).

## What just happened

Three separate things had to go: the remote's branch (a push), your local branch (a branch delete), and a stale bookmark (a prune). `push --delete` handled the first and tidied your own bookmark for it; the stale `origin/scratch` needed prune because nobody had told your clone about that deletion.
