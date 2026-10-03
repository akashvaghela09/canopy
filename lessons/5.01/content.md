A **branch** is a name that points to one commit. That is all it is: a short text label, not a copy of your files and not a separate folder.

The commit a branch points to is its **tip**. The branch's history is whatever you reach by following parents back from the tip. When you make a commit on a branch, the label moves forward to the new commit. You saw the same label move backwards in the reset lesson.

HEAD usually points to a branch, and the branch points to a commit. In the graph, the HEAD marker sits on main's flag. In the terminal, `git log` prints the same chain as `HEAD -> main`.

Three ways to list branches:

- `git branch` lists local branches and marks the current one with `*`.
- `git branch -v` adds the short id and message of each tip.
- `git branch --show-current` prints only the name of the branch HEAD is on.

## Try it

1. Draw the graph with every branch included. There are two branch labels.
2. Run `git branch`, then `git branch -v`. Match each short id with a commit in the graph.
3. Run `git branch --show-current`.
4. Answer the questions in the lesson panel.

## What just happened

The graph shows two colored flags on two different commits. Both branches share the older commits; nothing is duplicated. Switching, creating and deleting branches, which the next lessons cover, only move or add such labels.
