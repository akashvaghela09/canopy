A commit is a saved snapshot of your project: every file as it was at that moment, plus a message saying why, the name of the author, and the date. Each commit also remembers the commit that came before it, its parent. That chain of parents is the history. The very first commit has no parent.

Making a commit takes two commands. You will learn each properly in the next section; for now, type them as shown.

    git add .
    git commit -m "Start the project"

`git add .` tells git which files to include (here: all of them). `git commit -m "..."` saves the snapshot with that message.

## Try it

1. Check the status: two untracked files.
2. Run the two commands above.
3. Check the status again, then look at the graph. The first dot is your commit. `main` and HEAD point at it.
4. Run `git log` to see what git stored: the author, the date and the message. Answer the questions.

## What just happened

Git copied both files into its database and wrote down who, when and why. From now on git can always bring this version back, whatever you change later.
