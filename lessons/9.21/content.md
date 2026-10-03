When you notice a mistake in an earlier commit, you can fix it now and tidy later. `--fixup` makes a commit whose message is `fixup! <subject of the target>`:

    git commit --fixup=<commit>

`--squash=<commit>` does the same with `squash!`, for when you also want to edit the message. Later, one rebase folds them all in:

    git rebase -i --autosquash <base>

(Before git 2.44, `--autosquash` needs `-i`; without it nothing is folded.)

With `--autosquash`, git opens the todo list with every `fixup!` and `squash!` commit already moved under its target and marked accordingly. Save, and the history is clean. Set `rebase.autoSquash` to `true` in your config and every interactive rebase does this without the flag.

## Try it

1. Read the history: "Add model", "Add view", "Add controller" on top of a skeleton. Check the status: all three files have a small uncommitted fix.
2. For each file: stage it and commit it as a fixup of the commit that added that file.
3. Read the history: three `fixup!` commits on top.
4. Run an interactive rebase with autosquash from the skeleton commit. Read the todo list that opens, then save it unchanged.
5. Read the history: three commits again, no `fixup!`, and each file carries its fix.

## What just happened

Fixup commits record "this belongs to that" while you still remember it, and autosquash does the sorting that you did by hand in the squash lesson. Everything was rewritten, so as always: only before sharing.
