A commit two days ago added a tracking script to the site. The team decided it has to go. The commit is already in the history, and other commits have been made since, so you do not want to touch what is there.

```
git revert <commit>
```

makes a **new** commit that does the opposite of the one you name: lines it added are removed, lines it removed are added back, files it created are deleted. The original commit stays in the history. Git proposes a message starting with `Revert "..."`.

Revert is the undo you reach for when a commit may already be shared with other people: it adds to history instead of rewriting it.

## Try it

1. Read the history and find the commit "Add tracking script". It is one step below HEAD.
2. Run `git revert HEAD~1`. An editor opens with the prepared message; keep it, save and close it.
3. Read the history again. There is one more commit, and the one you reverted is still there.
4. Check that `tracker.js` is gone and `index.html` no longer loads it.

## What just happened

The graph has a new commit on top, and the old commit is untouched below it. Reverting a commit that is not the newest works as long as later commits did not change the same lines. If they did, git asks you to resolve a conflict; that comes in section 6.
