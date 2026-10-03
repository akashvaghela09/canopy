`origin/main` is not the remote's branch. It is your clone's **bookmark** of where `main` was on the remote the last time your clone talked to it. Git calls it a **remote-tracking branch**.

Three things follow from that:

- It can be out of date. The remote may have moved since.
- It can differ from your `main`. You commit on `main`; `origin/main` stays where it was.
- You cannot commit on it. Only talking to the remote (fetching, or pushing your own work) moves `origin/main`.

In the graph, remote-tracking branches are drawn in a different style from local ones.

## Try it

1. Draw the history as a graph with all branches. Find `main` and `origin/main`. They are on different commits: you made a commit, and so did a teammate.
2. Answer the first question.
3. Try to work on the bookmark: run `git switch origin/main`. Read what git says.
4. Answer the remaining questions.

## What just happened

Git refused to put you on `origin/main`, because it is a record of someone else's state, not a place to work. Its hint offers `--detach`: that only visits the commit (detached HEAD), and a commit made there would still not move `origin/main`. Your local `main` is where your commits go. `origin/main` only moves when git hears from the remote. The next lesson does exactly that: it fetches, and you watch `origin/main` move while `main` stays put.
