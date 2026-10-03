Resolving a conflict is three steps, and none of them is a special command:

1. **Edit** the file until it says what it should. Remove the `<<<<<<<`, `=======` and `>>>>>>>` lines. You can keep one side, the other, or write something new.
2. **Stage** the file. Staging is how you tell git "this one is resolved".
3. **Commit.** Git still remembers it is in the middle of a merge, so the commit becomes the merge commit, with both parents and a prepared message. `git merge --continue` does the same; it only works while a merge is in progress. Either one refuses while a file is still unresolved.

Files that merged cleanly are already staged; you only touch the conflicted ones.

## Try it

1. Merge `tagline` into `main`. One file conflicts: `tagline.txt`.
2. Read both sides. `main` changed "every day" to "every morning"; `tagline` added "and pastries". Both changes are wanted.
3. Edit the file so the single line reads `Fresh bread and pastries every morning`, with no markers left.
4. Stage the file and check the status: the conflict is gone.
5. Commit. The editor opens with the prepared merge message; save it.

## What just happened

The merge commit appears on the graph with two parents, like any other merge. The difference is only how it was made: git prepared most of it, and you supplied the one line it could not decide.
