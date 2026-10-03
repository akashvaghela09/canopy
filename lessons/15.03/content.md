Changing a library through its submodule is two commits in two repositories: first the change inside the library, then the pointer move in the project. The order matters. If you publish the project first, others get a pointer to a library commit they cannot fetch.

Inside a submodule HEAD is detached at the pinned commit, so attach it to a branch before committing.

- inside `lib/`: attach to `main`, change, commit, publish,
- in the project: stage `lib`, commit, publish,
- `git submodule update --remote <path>`: move the pointer to the library's latest remote branch without working inside it.

## Try it

1. Go into `lib/` and check the status: detached HEAD. Attach it to `main`.
2. Change `greet.txt` so it reads `hello there`. Commit inside `lib/` and publish the library.
3. Come back up. The status of `work` shows `lib` as modified with new commits. Stage `lib`, commit, and publish the project.
4. Look at the graph for `lib.git` and `app.git`: both moved.
5. Answer the question in the lesson panel.

## What just happened

The project's new commit points at the library commit you pushed. A teammate who pulls the project and runs the submodule update gets your greeting. When someone else updates the library, `git submodule update --remote lib` fetches their latest `main` into `lib/` and leaves the pointer change for you to commit.
