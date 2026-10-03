Git has no special record of a rename. When you rename a file, git sees one file deleted and another added; when the contents are the same or very similar, it reports a rename. There are two ways to get there:

    git mv notes.txt journal.txt

renames the file on disk and stages the change in one step. Or rename with plain `mv` (or in the files panel, which does the same) and then stage both the old name and the new name; git works out that they are the same file.

## Try it

1. Rename `notes.txt` to `journal.txt` with `git mv`. Check the status: "renamed".
2. Rename `draft.md` to `chapter1.md` with plain `mv` or in the files panel. Check the status: one file deleted, one untracked.
3. Stage both names (or everything) and check again: also "renamed".
4. Commit.

## What just happened

Both routes end in the same staged state, so the commit is the same either way. `git mv` is a shortcut, not a different kind of change.
