Deleting a file with the files panel or `rm` removes it from disk, but git still tracks it: the status shows it as deleted, and you still have to stage that deletion. `git rm` does both at once:

    git rm old-draft.txt

Sometimes you want the opposite: keep the file on disk but stop git from tracking it. A typical case is a settings file full of passwords that was committed by mistake. `--cached` removes the file from the staging area only:

    git rm --cached secrets.env

git prints `rm 'secrets.env'`, but the file stays on disk. Until you commit, the status lists it twice: as a staged deletion (it leaves the next commit) and as untracked (it is still in your folder). After the commit, git no longer tracks it.

## Try it

1. Remove `old-draft.txt` from the project with `git rm`. Check the status: the deletion is staged.
2. Untrack `secrets.env` but keep it on disk. Check the status: it is now untracked. (In real life you would add it to `.gitignore` next.)
3. Commit.

## What just happened

Both files are gone from the newest commit, but `secrets.env` is still in your folder. Older commits still contain both files: removing a file from git does not erase its past. A real password committed by mistake must also be changed.
