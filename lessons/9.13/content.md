This lesson removes two commits from `main`; their change (a debug file) is lost on purpose.

`--onto` is not only for moving branches between bases. Because it replays "everything after `<oldbase>`" onto any commit you name, it can cut a slice out of the middle of a branch:

    git rebase --onto <last-good> <last-bad>

Everything after `<last-bad>` is replayed directly on `<last-good>`; the commits in between are left out. The same shape transplants a range anywhere: `git rebase --onto <target> <start> <end>` moves the commits after `<start>` up to `<end>` onto `<target>`. If `<end>` is a branch, that branch moves; if it is a commit id, you end on a detached HEAD at the last copy and no branch moves.

## Try it

1. Read the history of `main`. Two commits in the middle, "Add debug prints" and "More debug output", should never have been committed. The two commits after them are fine.
2. Remove the two debug commits with one `--onto` rebase, using relative references counted from HEAD. Keep the commits after them.
3. Read the history again: four commits, no debug ones, and `debug.py` is gone.

## What just happened

The two kept commits were copied onto "Add help text"; the originals and the two debug commits are ghosted. A later lesson does the same job with an interactive rebase and the word `drop`, which is easier to read but comes to the same thing.
