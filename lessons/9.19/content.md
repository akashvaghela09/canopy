`git add` stages whole files. `git add -p` (patch mode) walks through the changes in a file one **hunk** at a time and asks about each:

    git add -p report.py

Answers you will use most:

- `y` stage this hunk, `n` skip it,
- `s` split the hunk into smaller ones (offered only when the hunk contains separate changes),
- `e` edit the hunk by hand in the editor,
- `q` stop asking; `?` shows all options.

Patch mode is how one messy editing session becomes several focused commits.

## Try it

1. `report.py` has four separate edits: two rounding fixes and two temporary `print("DEBUG ...")` lines. Look at the unstaged diff.
2. Run patch mode on the file. Stage the two fixes, skip the two DEBUG prints.
3. Check the staged diff: both fixes, no DEBUG lines. The strip under the graph shows the staged and working copies differ.
4. Commit the staged changes with the message `Fix rounding in report`.
5. Check the status: `report.py` is still modified, because the DEBUG lines remain in the working tree only.

## What just happened

The staging area held a version of `report.py` that never existed on disk: the old file plus two of the four edits. That is what a commit was made from. The debug lines are still yours to remove.
