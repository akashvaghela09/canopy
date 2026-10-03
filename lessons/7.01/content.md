So far every repository lived alone on your disk. Most real projects live in two places at once: a shared copy that the whole team pushes to and pulls from, and a personal copy on each person's machine. Git calls the shared copy a **remote**. The remote you copied your repository from is named `origin` by default.

In this course the remote is a folder called `origin.git` right next to your work. It is a **bare** repository: it holds the history, but no working files. On a real team it would be on a server, and you would reach it through a URL. The commands are the same.

To get your own copy of a remote, you clone it:

```
git clone <path-or-url>
git clone <path-or-url> <folder>
```

The second form chooses the folder name. `git clone -b <branch> <url>` starts on a branch other than the default one.

## Try it

1. List the lesson folder. There is nothing here but `origin.git`.
2. Run `git clone origin.git work`. Read what git prints.
3. Move into `work` and list its files. Draw the history as a graph. List the branches.
4. Answer the two questions in the lesson panel.

## What just happened

The clone copied every commit from `origin.git` and checked out `main`, the remote's default branch, so the files appear in `work`. The graph now shows two repositories: `origin` and your clone. Your clone remembers where it came from: later lessons use that link to fetch new work and push your own.

Note the `origin/main` label in your clone's graph. It marks where `main` was on the remote when you cloned. Lesson 7.03 explains it.
