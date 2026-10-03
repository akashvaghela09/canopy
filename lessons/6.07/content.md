Once a history has a few merges, a plain log mixes everything together: the commits made on `main`, the commits from each merged branch, and the merge commits themselves. Three options pick out one view:

- `git log --merges` shows only merge commits. Read as a list, it is the history of what was integrated and when.
- `git log --no-merges` hides them, leaving the commits where real work happened.
- `git log --first-parent` follows only the first parent of each commit. From `main` that means: the commits made directly on `main`, plus one entry per merge, and none of the commits that came in through the branches.

All three combine with the filters you already know, such as author and message filters, and with `--oneline` and `--graph`.

## Try it

1. Draw the full history to get a feel for the shape: three branches were merged into `main` over time.
2. List only the merge commits. Count them and note which branch was merged last.
3. Walk `main` with `--first-parent` and count the commits in that view.
4. Count Sam's commits, leaving merge commits out.
5. Answer the questions.

## What just happened

`--first-parent` is the view a release manager wants: one line per feature, in the order the features landed. `--merges` answers "what came in and when". `--no-merges` is for counting and searching actual changes, since a clean merge commit contains no changes of its own.
