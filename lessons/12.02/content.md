A pull request is not a git feature. It is a message: "I have a branch, please review it and merge it." GitHub, GitLab and others wrap that message in a web page with comments and buttons. Underneath, the review is done with commands you already know: list the commits a branch adds, read its diff, check whether it is merged.

Git ships a small helper for the message part. `git request-pull <base> <url> <branch>` prints a summary of the commits a published branch adds on top of `<base>`, together with the URL and branch name to pull from. It was written for mailing lists, and it works with any remote, including a folder on your disk.

## Try it

Sam asked you to review the branch `sam/export`. It is already in your clone as a remote-tracking branch.

1. Read the request like a reviewer: list the commits it adds on top of `main`, then read the full diff between `main` and the branch.
2. Check whether `sam/export` is already merged into `main`. The branch list can filter remote branches by merged state.
3. Answer the three questions in the lesson panel.
4. Now prepare your own request. Your branch `import-csv` is finished but not published. Publish it to origin.
5. Run `git request-pull main origin import-csv` and read the summary it prints. That text is your pull request.

## What just happened

The summary names the base commit, where to fetch from, a shortlog of the branch's commits by author, and a diffstat: the facts a review page shows. A platform adds conversation and a merge button; the facts come from git.
