Bisect is not only for regressions. Negative numbers used to make `tally.sh` exit with an error; today `bash tally.sh -2 5` is accepted. When did that get fixed? The search is the same, but calling the fixed commits "bad" gets confusing. Name the two sides yourself:

```
git bisect start --term-old=broken --term-new=fixed
git bisect fixed            # HEAD
git bisect broken v2.0
```

Git also has the built-in neutral pair `old` and `new`. Whatever the words, the rule is the same: the older end has one state, the newer end the other, and git finds the first commit with the new state.

Two more things happen in real histories:

- **A commit you cannot test.** Here, three commits in the middle have a syntax error in `tally.sh`, so the script does not run at all; that is neither broken nor fixed. Say `git bisect skip` and git chooses a nearby commit instead. If the answer ends up inside a skipped stretch, git tells you it cannot narrow further.
- **Merges.** Bisect walks the whole graph, not only one branch, so it may check out commits from a merged side branch. Your test must work there too, or you skip them. With `git bisect start --first-parent` (git 2.29+) it stays on the main line and treats each merged branch as one step.

## Try it

1. Confirm the current behaviour: `bash tally.sh -2 5` exits 0. (It prints -2, not 3, because of the bug you found in the last lesson; for this search only the exit code matters.) At `v2.0` it printed an error and exited 1.
2. Start a bisect with your own terms, mark HEAD fixed and `v2.0` broken.
3. At each step run `bash tally.sh -2 5; echo $?`. Exit 0 means fixed, 1 means broken. If you see a syntax error (exit 2), skip the commit.
4. Read the "first fixed commit" line and note the id.
5. Reset the bisect and answer the questions in the lesson panel.

## What just happened

`good`/`bad` are the default names for `old`/`new`. Skipping tells git "no information here"; it costs one extra step and keeps the search honest instead of feeding it a guess.
