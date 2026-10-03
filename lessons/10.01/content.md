Someone ran a hard reset on this journal and two days of entries vanished from the log. They are not gone. Every time HEAD moves, git writes a line in a private diary called the **reflog**: commits, switches, resets, merges, all of it. Nothing in it is shared when you push; it is your machine's record of where you have been.

```
git reflog
```

prints that diary for HEAD, newest first. Each line has the commit HEAD pointed to *after* the action, a label like `HEAD@{2}`, and what happened ("commit: ...", "reset: moving to ...").

Branches keep a reflog too:

```
git reflog show main
```

## Try it

1. Read the history. Only Monday and Tuesday are left in the log. The graph still shows Wednesday and Thursday, in gray: commits that only the reflog remembers.
2. Run `git reflog`. The newest line is the reset. The line below it is where HEAD stood a moment before.
3. Look at `main`'s reflog as well and find the same commit there.
4. Open the commit the reflog points to and check its message.
5. Answer the questions in the lesson panel.

## What just happened

A reset moves the branch label; it does not delete commits. The commits are still in the repository, and the reflog remembers their ids. The next lessons use those ids to put things back. Reflog entries do expire eventually (lesson 10.11), so this net has a time limit, but it is measured in weeks, not minutes.
