The last commit was amended to fix its message, but a stale staged deletion went along for the ride: `docs/export.md` was dropped from the commit without anyone noticing. Amend does not modify a commit; it writes a new one and moves the branch. The original is one move back in the reflog.

```
git show --stat HEAD@{1}
git diff HEAD@{1} HEAD
```

The first shows the commit as it was before the amend; the second shows exactly what the amend changed. From there you choose:

- **One file went missing:** bring that path back from `HEAD@{1}` and commit it.
- **You want the old commit's change back as its own commit:** cherry-pick `HEAD@{1}`. Git re-applies the old commit on top; where the amend changed the same lines, you resolve a conflict.
- **The amend was a mistake altogether:** hard-reset to `HEAD@{1}` and redo the message.

## Try it

1. Compare `HEAD@{1}` with `HEAD`. One file is missing from the amended commit.
2. Restore `docs/export.md` from `HEAD@{1}` into your working tree.
3. Commit it (a new commit is fine; amending again is fine too). Cherry-picking `HEAD@{1}` also works here.
4. Make sure the improved message with "(closes #12)" is still in the history and the status is clean.

## What just happened

Every amend leaves the previous version of the commit in the reflog, so "I amended and lost something" is always recoverable within the reflog's lifetime. `git diff HEAD@{1} HEAD` right after an amend is a cheap habit that catches this on the spot.
