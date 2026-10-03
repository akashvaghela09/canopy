A **subtree** puts a library's files straight into a folder of your project. They are ordinary tracked files: a plain clone has them, no extra step, no pointer. The link to the library's repository exists only when you choose to sync.

- `git subtree add --prefix=<dir> <repo> <branch> --squash`: bring the library in as one commit,
- `git subtree pull --prefix=<dir> <repo> <branch> --squash`: merge the library's newer commits into the folder,
- `git subtree push --prefix=<dir> <repo> <branch>`: send the commits that touched the folder back to the library,
- `git subtree split --prefix=<dir>`: the engine behind push; it rewrites the folder's history as a standalone history and prints its tip (`-b <name>` makes it a branch).

`--squash` keeps the library's own history out of yours: one commit per sync.

## Try it

1. Vendor the library: `git subtree add --prefix=vendor/lib ../lib.git main --squash`. Look at the graph: a squash commit and a merge.
2. Press **Sam publishes lib 1.1** in the lesson panel.
3. Pull the update into the folder with `subtree pull` and the same options. `vendor/lib/version.txt` now says 1.1.
4. Add the line `patched in app` to `vendor/lib/greet.txt` and commit it like any other change.
5. Send that fix upstream: `git subtree push --prefix=vendor/lib ../lib.git main`. Check `lib.git` in the graph.
6. Answer the question in the lesson panel.

## What just happened

Both directions worked through plain merges: `pull` merged the library's branch into the folder, and `push` split the folder's history back out and pushed it. Nobody cloning your project needs to know a library is involved.
