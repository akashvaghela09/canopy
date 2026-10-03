This lesson throws away two commits, a staged edit and an unstaged edit; none of them can be brought back with what you know so far.

Two experimental commits and some half-finished edits have turned `deploy.sh` into a mess. The commit "Working version" is known to be good. You want the repo back to exactly that state: history, staging area and files.

```
git reset --hard <commit>
```

moves the branch to that commit, and makes the staging area **and your files on disk** match it. Anything not in that commit is gone: later commits leave the branch, staged changes are dropped, edits in tracked files are overwritten. Untracked files are not touched; lesson 4.11 deals with those.

Because it touches files on disk, this is the one reset to pause before. Read the status first so you know what you are about to lose.

## Try it

1. Check the status and read the history. Note the two experiment commits, the staged change and the unstaged change.
2. Find "Working version" and its position relative to HEAD.
3. Run `git reset --hard HEAD~2`.
4. Check the status and the file: clean, and `deploy.sh` is the working version.

## What just happened

Soft reset moves the branch. Mixed also resets the staging area. Hard also rewrites the working tree. The three reset forms are the same move with more and more areas following along. The dropped commits still exist inside the repo for a while; section 10 shows how to get them back if you ever need to.
