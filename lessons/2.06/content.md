When every change you made is to files git already tracks, you can skip staging:

    git commit -a -m "Describe the change"

`-a` stages every modified and deleted tracked file, then commits, in one step. It is the same as staging every change to tracked files and then committing, so it has the same blind spot: files git has never seen are left out.

## Try it

1. Check the status: two modified files and one untracked file.
2. Commit with `-a` and a message.
3. Check the status again and answer the question.

## What just happened

The commit holds the changes to `app.py` and `README.md`. `TODO.md` is still untracked: `-a` never adds new files. When you create a file, you have to stage it yourself the first time. After that, `-a` will pick up its changes like any other tracked file.
