Yesterday you checked out an older commit to try a physics change, made two commits there, and switched back to `main`. Git printed a warning that two commits were "left behind", with their ids. The terminal is long closed. Where are they?

Commits made on a detached HEAD belong to no branch, so no branch label points at them and the log does not show them. HEAD's reflog does: it recorded both commits and the switch away. The fix is to attach a name to the last of them.

```
git branch physics-experiment HEAD@{1}
```

Any form that creates a branch at a given commit works, including the one that creates and switches in one step.

## Try it

1. Draw the graph in the terminal: only `main`'s four commits are listed. The graph panel also shows two gray commits; those are the experiment, which only the reflog still remembers.
2. Print the reflog. Find the "checkout: moving from ... to main" line; the id it moved *from* is the tip of the experiment. The two "commit:" lines just below it confirm it.
3. Create a branch at that commit.
4. Draw the graph again, with all refs. The experiment is back.

## What just happened

"Detached" only means "no branch is following along". The commits were as real as any other; they were just unnamed. The warning git prints when you leave them is your cue to name them right away, with the id it shows.
