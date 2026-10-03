Three options change how a cherry-pick records itself:

- `git cherry-pick -x <commit>` adds a line `(cherry picked from commit <id>)` to the message. Use it when the original is on a public branch, so readers can find where the change came from.
- `git cherry-pick -n <commit>` (or `--no-commit`) applies the change to your files and the staging area but makes no commit. Pick several commits this way and commit them as one.
- `git cherry-pick -e <commit>` opens the editor so you can change the message before committing.

## Try it

1. Branch `wip` has three commits that `main` lacks: a crash fix and two small changelog commits. Find their ids.
2. On `main`, cherry-pick the crash fix with `-x`. Read its message afterwards.
3. Cherry-pick the two changelog commits with `-n`, one after the other. Check the status: `CHANGELOG.md` is staged, nothing is committed yet.
4. Commit the staged changelog as one commit with a message of your choice.

## What just happened

`main` gained two commits for three originals. The first carries the id of its source; the second combines two picks into one. `-n` is also handy when a pick needs a small edit before it fits.
