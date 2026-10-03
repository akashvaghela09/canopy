The full log shows every detail of every commit: author, date, the whole message. That is a lot to scroll through once a project has more than a handful of commits.

`git log --oneline` prints one line per commit: a short id and the first line of the message. That is usually all you need to find your way around.

You can also limit how many commits are shown: `git log --oneline -n 3` prints only the three newest. `-3` is a shorter way to write the same thing.

## Try it

1. This repo is the website of a small bakery. Read the full history once, the way you learned earlier, and notice how long it is.
2. Run `git log --oneline` and count the commits.
3. Run `git log --oneline -n 3` to see only the newest three.
4. Answer the questions in the lesson panel.

## What just happened

Both commands read the same history. `--oneline` only changes how much of each commit is printed, and `-n` only changes how many commits are printed. The short id at the start of each line is the first few characters of the commit's full id; you can use it anywhere git asks for a commit.
