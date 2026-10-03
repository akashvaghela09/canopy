A rebase replays commits one at a time, so a conflict stops it in the middle. Git tells you which commit it could not apply, leaves the conflict markers in the file, and waits:

    git rebase --continue   # after resolving and staging
    git rebase --skip       # leave this commit out and go on
    git rebase --abort      # put everything back as it was

While a rebase is paused, `git status` shows "interactive rebase in progress", the commit it stopped at, and how many are done. HEAD is detached on the partly built copy; the branch label only moves when the rebase finishes.

## Try it

1. You are on `limits`, three commits ahead of the fork. `main` changed the default limit to 20 in the meantime; your second commit changed the same line to 5 and added a unit line.
2. Rebase `limits` onto `main`. Watch the replay stop at the second commit.
3. Read the status, then answer the question about where it stopped.
4. Resolve `config.toml`: keep `limit = 20` from `main`, keep the new `unit` line from your commit. Stage the file and continue the rebase.
5. The third commit replays on its own. Check the graph: three copies on top of `main`.

## What just happened

The copy of the second commit contains your resolution, not the original change, which is why its content differs from the ghosted original. If you had chosen `--abort`, `limits` would be exactly where it started.
