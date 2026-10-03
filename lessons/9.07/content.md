A cherry-pick is a small three-way merge, so it can conflict like one. Git stops, marks the file, and waits. You have the same choices as in a merge, plus one, with the cherry-pick's own spelling:

    git cherry-pick --continue   # after you resolved and staged the file
    git cherry-pick --skip       # drop this commit and move on
    git cherry-pick --abort      # undo the whole command, including picks already committed
    git cherry-pick --quit       # stop here; keep the commits made so far, leave files as they are

`--skip` matters when you pick a range: it drops the one that failed and goes on with the rest. On a single pick, `--skip` and `--abort` end up in the same place. `--quit` does not clean up: a file still in conflict stays conflicted, so restore it afterwards.

## Try it

Branch `fixes` has three commits that each change one line of `settings.conf`. Meanwhile `main` tuned all three lines, so every pick conflicts.

1. Pick "Raise timeout to 60" onto `main`. Resolve the conflict so the timeout is 60 and the other two lines stay as `main` has them. Stage the file and continue.
2. Pick "Raise retries to 5". The team decided against it: skip it.
3. Pick "Enable debug logging". That one needs more discussion: abort it.
4. Check the status: no cherry-pick in progress, clean tree, and `main` has one new commit.

## What just happened

Only the first pick became a commit. The other two left no trace on `main`; the originals are still on `fixes` for later.
