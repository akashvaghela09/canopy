Switching moves HEAD from one branch label to another, and makes the files on disk match that branch's tip.

```
git switch <branch>
```

Afterwards HEAD points to that branch, and every tracked file is as it was in that branch's latest commit. Files that are identical in both branches are not touched at all.

```
git switch -
```

goes back to the branch you were on before, the same way `cd -` returns to the previous folder.

## Try it

1. Print `trails/lake.md`. It has no winter note.
2. Draw the graph: `winter` is one commit ahead of `main`.
3. Run `git switch winter`, then print `trails/lake.md` again. The winter note is there now.
4. Check the status. It is clean: git changed the file to match the branch, so there is nothing to commit.
5. Run `git switch -` to go back to `main`, and print the file once more.
6. Switch to `winter` again and answer the question in the lesson panel.

## What just happened

Watch the graph: the HEAD marker moved from one flag to the other, but no commit moved and no commit was created. Switching only decides which commit is "where you are", and git rewrites your files to match it.
