When your push is rejected because origin moved on, you have so far pulled with a merge (`--no-rebase`, or `pull.rebase false`). That leaves a merge commit behind that says nothing more than "I synced". `pull --rebase` fetches, then rebases your local commits on top of what arrived:

    git pull --rebase

Your commits are your own, not yet pushed, so rewriting them is fine, and the history stays a line. If the replay conflicts, it is a normal rebase conflict: resolve, stage and continue the rebase. Make it the default so a plain `git pull` behaves this way:

    git config pull.rebase true

## Try it

1. You have two local commits on `main`. Try to push them and read why origin refuses.
2. Pull with rebase. Draw the graph: Sam's commit, then your two on top of it, no merge commit.
3. Push again; this time it goes through.
4. Set `pull.rebase` to `true` for this repository, so that future pulls rebase without the flag.

## What just happened

Section 7 taught pull as fetch plus merge. `pull.rebase true` is the rebase answer to the hint a plain `git pull` printed in 7.06. With `--rebase` the second half is a rebase instead, which is what most teams want for their own unpushed commits. Teammate commits are never rewritten by this: only yours are replayed.
