An interactive rebase lets you decide what happens to each replayed commit. It opens a **todo list** in the editor: one line per commit, oldest first, each starting with a command. `pick` means "replay as is".

    git rebase -i HEAD~3      # the last three commits
    git rebase -i --root      # every commit, including the first

Edit the list and save it, and git carries it out from top to bottom. Lines you delete are dropped. The list can also hold `break`, which pauses the rebase at that point so you can look around; `git rebase --continue` goes on and `git rebase --abort` undoes the whole run.

The next lessons teach the other commands: `reword`, `squash`, `fixup`, `drop`, `edit`, `exec`.

## Try it

1. Read the last four commits.
2. Start an interactive rebase of the last three commits. Read the todo list: three `pick` lines. Which commit is on the first line? Save it unchanged. Git reports a successful rebase and the ids did not change.
3. Start it again. This time put a line containing only `break` above the first pick and save. The rebase pauses. Read the status: it tells you the rebase is in progress and what comes next.
4. Abort the rebase, and check that `main` is where it started.
5. Answer the questions.

## What just happened

With nothing changed in the list, each commit's parent was still the same, so git kept the original commit instead of making a copy. No ghosts appeared. The todo list is the whole interface: everything else in interactive rebase is a different word in that list.
