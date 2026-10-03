Trunk-based development keeps everyone close to `main`. Branches live for an hour or an afternoon, hold one small change, and are integrated as soon as they work. Nobody has a week of unmerged work, so integration is never a big event.

Teams that work this way usually add two rules:

- `main` moves only forward in a straight line. Right before you integrate, update `main` with a fast-forward-only pull, so your change lands on the newest trunk. If your push is then rejected, someone pushed first: put your commit on top of the new `origin/main` and push again. Never merge.
- Each task lands as one commit. Squash-merge the branch, or rebase its single commit onto `main` and fast-forward. Either way the trunk stays a straight line, and every commit on it is a complete, working change.

## Try it

Three small tasks are waiting. Between them, Sam pushes too; the lesson panel has two buttons for that. Do the tasks in order and press each button where the steps say.

1. Task 1: on a tiny branch, add a `LICENSE` file containing the line `MIT License`. Integrate it into `main` as one commit and push. Delete the branch.
2. Press "Sam pushes: changelog entry".
3. Task 2: on a new tiny branch, add `docs/usage.md` with a line `lantern add <text>`. Before integrating, bring `main` up to date with a fast-forward-only pull. Integrate as one commit, push, delete the branch.
4. Press "Sam pushes: count command".
5. Task 3: same again with a `.editorconfig` file containing `indent_size = 2`.

## What just happened

Look at `origin/main` in the graph: five new commits in a straight line, three from you and two from Sam, with no merge bubbles. Each one can be read, reverted or deployed on its own.
