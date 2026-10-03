This lesson drops a commit; its change (a TODO note) is lost on purpose.

The todo list is a plain text file, and its order is the replay order. Move a line and the commit moves. Change `pick` to `drop` (or delete the line) and the commit is left out.

Reordering can conflict. Each commit is replayed as a change against its new neighbour, and if two commits touched the same lines, each one now meets a file that looks different from what it expects. Expect git to stop once for each of them; resolve, stage, continue, as in any rebase.

## Try it

1. Read the history: on top of "Add recipe skeleton" come "Add step: fry the pancakes", "Add TODO note" and "Add step: mix the batter". Mixing has to come before frying, and the TODO note should not be committed at all.
2. Start an interactive rebase over those three commits. Move the mix line above the fry line and drop the TODO line. Save.
3. Git stops at the mix step: `pancakes.md` should end with the mix line only. Resolve, stage, continue.
4. Git stops again at the fry step: `pancakes.md` should end with the mix line, then the fry line. Resolve, stage, continue.
5. Read the history: two commits, mix before fry, no TODO, and the steps in the right order in the file.

## What just happened

Both conflicts came from the swap: in its new position each commit was asked to append to a file whose end had changed. Reordering commits that touch different files never conflicts; reordering commits that touch the same lines usually does, twice.
