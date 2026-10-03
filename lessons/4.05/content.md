The two newest commits added a banner ad and a popup. Both have to go. You could revert them one at a time, but two "Revert ..." commits for one decision is noisy. Revert has options for this.

- `git revert --no-edit <commit>` skips the editor and uses the prepared message.
- `git revert --no-commit <commit>` (or `-n`) undoes the commit in your files and the staging area, but does not commit. You can inspect, adjust, and then commit yourself with a message of your choice.
- A range such as `HEAD~2..HEAD` names several commits; revert handles them newest first.

Combined: `git revert --no-commit HEAD~2..HEAD` stages the undo of both commits, and one normal commit finishes the job.

## Try it

1. Read the history and confirm the two newest commits are "Add banner ad" and "Add popup".
2. Run `git revert --no-commit HEAD~2..HEAD`.
3. Check the status: the removals are staged, nothing is committed yet. Git says a revert is in progress; making a normal commit finishes it.
4. Make one commit with the message "Remove ads and popup".

## What just happened

Both reverts landed in the staging area and became a single commit. The two original commits are still in the history below it. With `--no-commit` you could also have edited a file before committing, which is useful when a revert needs a small adjustment.
