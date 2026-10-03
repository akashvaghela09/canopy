Sometimes you want history to say "this branch has been dealt with" without taking a single line from it: an abandoned approach, or an old release branch whose fixes already exist on main in another form.

`git merge -s ours <branch>` makes a merge commit with two parents whose tree is exactly the current branch's tree. The other side's changes are ignored entirely.

This is not `-X ours`. The capital-X form is an option to the normal strategy: it still merges everything that merges cleanly and only prefers our side where lines conflict.

## Try it

1. `legacy-fix` switched `config.yaml` back to the legacy queue. Read the file on both branches.
2. Merge it with the ours strategy: `git merge -s ours legacy-fix -m "Close legacy-fix; the new queue stays"`.
3. Read `config.yaml` again: unchanged. Look at the graph: a merge commit with two parents.
4. Check which branches are merged into main: `legacy-fix` is now listed, so it can be deleted safely.
5. Answer the question in the lesson panel.

## What just happened

The merge commit records that `legacy-fix` is an ancestor of main, so git will never try to merge those commits again. Its content was dropped on purpose, and the merge message is the place to say why.
