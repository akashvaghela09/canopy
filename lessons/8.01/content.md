Sometimes you are in the middle of an edit and need to be somewhere else: another branch, a quick check, an urgent fix. Committing half-done work feels wrong, and switching is refused when your edits would be overwritten. The stash is the third option: park the edits, do the other thing, bring them back later.

```
git stash           park all tracked changes (staged and unstaged) and clean the working tree
git stash push      the same, the long form that takes options
```

The parked changes live in a stash entry, outside any branch. In the graph it appears as a `stash@{0}` label on the commit it was made on, and in the Stashes strip under the graph.

## Try it

1. Check the status: `README.md` and `app.py` are modified.
2. Try to switch to `release-notes`. Git refuses, because `README.md` differs on that branch and your edit would be lost.
3. Run `git stash`. Check the status: clean. Look at the files panel: your edits are gone from disk.
4. Switch to `release-notes` and look at `README.md` there. Then switch back to `main`.
5. Answer the question.

## What just happened

The stash took a snapshot of your edits and reset the working tree to the last commit, so the switch had nothing to overwrite. The edits are not lost; they sit in the stash entry, waiting. The next lessons look inside stashes and bring them back.
