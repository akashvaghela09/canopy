Git's defaults are cautious. A handful of settings make daily work smoother, and most people set them once and forget them:

- `pull.rebase true`: `git pull` rebases your local commits instead of creating merge commits.
- `fetch.prune true`: fetching removes remote-tracking branches that were deleted on the server.
- `push.autoSetupRemote true`: the first `git push` of a new branch publishes it and sets tracking, no `-u` needed.
- `rebase.autoStash true`: rebase (and pull with rebase) stashes uncommitted changes first and restores them after.
- `merge.conflictstyle zdiff3`: conflict markers also show the common ancestor, which makes conflicts easier to read.

Also worth knowing: `init.defaultBranch` (Canopy already sets `main`), `core.editor` to pick the editor git opens, and `diff.algorithm histogram` for diffs that handle moved blocks better. At home these go in your global config. Canopy gives each lesson its own global file, so here either level works.

## Try it

1. Set all five settings above in this repo.
2. The branch `stale` was deleted on origin after you cloned. Fetch, and confirm `origin/stale` disappears from the remote branch list.
3. Sam pushed to `main`, and you have an unpushed commit and an uncommitted edit in `README.md`. Pull. With the settings above git stashes the edit, replays your commit on top of Sam's, and restores the edit. Answer the question in the lesson panel.
4. Create a branch `quick-fix`, change `src/cli.js` in any way, commit, and push it with a plain `git push`. Check that tracking was set up.

## What just happened

Five lines of configuration removed four small chores: pruning by hand, stashing around a pull, typing `-u`, and reading conflicts without context. Keep a list of settings like these; they are the first thing to restore on a new machine.
