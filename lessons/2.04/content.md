Staging files one at a time gets slow. `git add` also takes folders and a few flags, and four forms cover most days:

- `git add src` stages every change inside the `src` folder: new, modified and deleted files.
- `git add -u` stages changes to files git already tracks: modified and deleted, but **not** new files. The `u` is for "update".
- `git add -A` stages everything in the whole repo: new, modified and deleted.
- `git add .` is the same as `-A` for the folder you are in and everything below it.

## Try it

1. Check the status. There is a modified file, a deleted file and two new files.
2. Stage only the changes to tracked files: the modification and the deletion. Check the status: the two new files are still untracked.
3. Now stage everything, and commit it all in one commit.
4. Answer the question.

## What just happened

`-u` is the careful option: it never picks up files you did not know about. `-A` is the thorough one. Both stage deletions; so does plain `git add` on a file you have removed from disk.
