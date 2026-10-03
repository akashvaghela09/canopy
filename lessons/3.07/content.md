`HEAD` is git's name for "where you are right now". It points to the commit your next commit will be built on top of. Usually HEAD points to a branch, and the branch points to a commit; the graph writes that as `HEAD -> main`.

Because HEAD is a name for a commit, you can use it anywhere a commit id goes:

- `git show HEAD` opens the current commit,
- `git log -1` prints only the first commit of the log, which starts at HEAD: the same commit.

HEAD does not stay still. Every time you commit, the branch moves to the new commit, and HEAD moves with it.

## Try it

1. Run `git show HEAD` and note which commit HEAD points to.
2. Answer the first question in the lesson panel.
3. Add a line to `README.md` and make a commit. Any message is fine.
4. Run `git log -1` and draw the graph. Watch where `HEAD -> main` sits now.
5. Answer the remaining question.

## What just happened

Your new commit's parent is the commit HEAD pointed to before. Then `main` moved forward to the new commit, and HEAD followed. The old commit did not go anywhere; it is now one step behind HEAD.
