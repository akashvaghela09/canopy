This lesson discards uncommitted edits and untracked files in the `scrap` folder; the other three folders lose nothing.

You now know six ways to undo. The skill is picking the one that fits. Two questions decide it:

1. **Is the change committed?** If not, you only need to work on the files or the staging area: throw away edits, unstage, or delete untracked files.
2. **Has anyone else got the commit?** If the commit is only on your machine, you can move the branch back and redo it. If others may have it, add a new commit that undoes it and leave history alone.

There are four small repos in this lesson, one folder each. Move into each folder, read the situation, pick the undo, and do it.

## The cases

**1. `wrong-file`**: your last commit "Add meeting notes" included `secret.env` by accident. Nobody has pulled it. Make the commit contain `notes.md` only. `secret.env` should stay on disk, untracked.

**2. `shared`**: the newest commit, "Disable caching", was pushed yesterday and your teammates have it. Caching must come back on. Undo the commit without rewriting history.

**3. `scrap`**: an experiment went nowhere. Two tracked files were edited, one edit was staged, and there are stray untracked files and a folder. Drop every uncommitted change and all untracked files. Keep the history as it is.

**4. `too-early`**: you staged `report.md`, but it is not finished. Take it out of the staging area and keep the edit.

## What just happened

Each case had a fitting kind of undo. Case 1 and 2 both involve a committed change; what separated them was whether anyone else had it. Case 3 and 4 never reached a commit, so no history was involved at all.
