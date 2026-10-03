After a rebase, cherry-pick or amend, the new commits have new ids and may even have new messages. What stays the same is the *change* itself. Git can compare commits by their change, not their id:

- `git patch-id`: reads a diff and prints a hash of its content with line numbers and whitespace ignored, so the same change made at different places gives the same id,
- `git cherry -v <upstream> <head>`: for each commit in head but not upstream, prints `-` if upstream has a commit with the same patch id, `+` if not.

Canopy uses this idea to draw a rewritten commit as a copy of its original.

## Try it

1. `feature` is the original branch. `feature-v2` is its rebased copy with reworded messages; one commit was also edited during the rebase.
2. `git cherry -v feature-v2 feature`. Two lines start with `-`, one with `+`.
3. Confirm one match by hand: pipe the diff of the first commit on `feature` and of the first on `feature-v2` through `git patch-id` and compare the first column.
4. Do the same for the `+` commit and its counterpart: different ids, because the content changed.
5. Compare the two branches as ranges with the tool from section 11 if you want the full picture, then answer the questions.

## What just happened

Patch ids see through rebases and rewordings. The same patch-id comparison is how git decides which commits to skip during a rebase or `pull --rebase` when upstream already has them.
