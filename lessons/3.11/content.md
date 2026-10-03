The menu says a baguette costs 40.0. Somebody made a mistake. Instead of reading the whole file history, ask git about that one line:

```
git blame pages/menu.md
```

prints the file with, in front of every line, the commit that last changed it, the author and the date (when the file was renamed, also the name it had in that commit). To look at only some lines, give a range:

```
git blame -L 4,6 pages/menu.md
```

Blame tells you the *last* change to a line, not every change. If a line was moved or reformatted later, blame points at that later commit, so read the commit it names before you draw conclusions.

## Try it

1. Run `git blame pages/menu.md` and find the baguette line.
2. Narrow it down with `-L` to only that line.
3. Open the commit blame names and read what it changed. Is it only the baguette?
4. Answer the questions in the lesson panel.

## What just happened

Blame walks back through the file's history for each line and stops at the first commit that produced the line as it is now. It answers "who do I ask about this?", and the commit message tells you why the line is the way it is.
