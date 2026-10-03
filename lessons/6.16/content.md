`git merge` has options that change how a merge is made. `-X` passes a hint to the merge strategy; the rest change what happens at the end.

- `git merge -X ours <branch>` and `-X theirs`: when a hunk conflicts, take that side **for that hunk only**. Everything that merges cleanly is still merged from both sides. This is different from `git restore --ours`, which replaces a whole file with one side. `-X` does not settle conflicts like deleted-by-them; those still stop the merge. Do not confuse `-X ours` with `-s ours`: the strategy `ours` ignores the other branch's changes entirely and keeps your tree as it is.
- `git merge -X ignore-space-change <branch>`: treat lines whose only change is whitespace as unchanged, so a reformatting on one side does not conflict with real edits on the other.
- `git merge --no-commit <branch>`: do the merge but stop before committing, so you can inspect or adjust the result. You then commit as usual, or abort. If the merge would be a fast-forward, git fast-forwards anyway, since there is no merge commit to hold back; add `--no-ff` to stop in that case too.

## Try it

1. Draw the history. `pricing` and `main` both changed the coffee price in `prices.txt`; each also made another change of its own.
2. Merge `pricing` with `-X theirs`. No conflict is reported. Read `prices.txt`: the coffee line is `pricing`'s, the toast line is `main`'s, and the cake line arrived too.
3. Merge `footer` with `--no-commit`. Check the status: the merge is staged but not committed.
4. Look at what is staged, then commit the merge.
5. Answer the question.

## What just happened

`-X theirs` made the three-way merge decide the one hunk it could not decide alone; it did not throw away `main`'s other work. `--no-commit` gave you a pause between "merged" and "committed", the same pause a conflict forces on you, but on your terms.
