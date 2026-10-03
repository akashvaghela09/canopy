History is not always a straight line. People work on side branches and merge them back, so the real shape is a graph. The app draws that graph for you; the terminal can draw it too.

Three options turn the compact log into a drawing:

- `--graph` draws the lines between commits,
- `--all` includes every branch, not only the one you are on,
- `--decorate` prints labels: branch names, tags and `HEAD` (a terminal shows them anyway; the option makes sure).

Put them together: `git log --oneline --graph --all --decorate`.

In the drawing, a **branch tip** is the commit a branch label sits on. A **merge commit** is where two lines join. `HEAD -> main` marks where you are now.

## Try it

1. Run `git log --oneline --graph --all --decorate` in the bakery repo.
2. Hold the terminal output next to the graph in the app. Find the same merge, the same two side branches, and `HEAD` in both.
3. Answer the questions in the lesson panel.

## What just happened

The app's graph and the terminal drawing are two views of the same commits. Branch labels like `seasonal-menu` and `dark-mode` are only pointers to a commit; you will learn to create them in section 5. For now you only need to read them.
