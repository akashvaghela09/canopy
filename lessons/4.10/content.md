`git reset` with a **path** behaves differently from `git reset` with a commit:

```
git reset <file>
```

does not move the branch at all. It copies that one file from HEAD into the staging area, which unstages it. The file on disk keeps your edits. This is the same effect as the unstage command from lesson 4.02, and you will see both in the wild; `reset <file>` is the older spelling.

A reset only moves the branch when it is given a commit and no paths. With paths it works on the staging area only, so your files on disk are never touched.

## Try it

1. Two files are staged: `chapter1.md` and `notes-private.md`. The private notes should not be committed.
2. Run `git reset notes-private.md`.
3. Check the status: `chapter1.md` is still staged, `notes-private.md` is modified but not staged.
4. Look at the graph. `main` did not move.
5. Answer the question in the lesson panel.

## What just happened

Reset works on up to three things: the branch, the staging area and the working tree. With a path it is limited to the staging area, for that file only. That is why it is safe and why the branch stays where it is.
