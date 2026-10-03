When you cannot push to a project, you fork it: a copy of the repository that you own. You clone your fork, so `origin` is the fork. The original project becomes a second remote, by convention called `upstream`. Your changes go to the fork on a branch; the project pulls them from there.

Forks drift. Every so often you fetch `upstream`, fast-forward your `main` to `upstream/main`, and push `main` to `origin` so the fork catches up. Contribution branches start from that synced `main`, never from a stale one, so they apply to the project as it is today. Hosting platforms offer a "sync fork" button that does the same fetch, fast-forward and push.

## Try it

Your clone `work` came from `fork.git`. The original project is `upstream.git`, two commits ahead.

1. Add a remote named `upstream` for `../upstream.git` and fetch from it.
2. Sync: bring your `main` up to `upstream/main` (a fast-forward), then push `main` to origin.
3. Create a branch `fix-typo` from the synced `main`. In `README.md`, change "termnal" to "terminal". Commit.
4. Push `fix-typo` to origin with tracking. That branch is what you would open a pull request from.

## What just happened

Two remotes, two jobs: `upstream` is read-only for you and is where truth comes from; `origin` is yours and is where your branches live. Your fork's `main` now matches the project, and your fix sits on a branch that starts from the current project state.
