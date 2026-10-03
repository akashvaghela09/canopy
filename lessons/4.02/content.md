You staged two files, then realised one of them is not ready. You want to take it out of the next commit, but keep the edits on disk.

```
git restore --staged <file>
```

does exactly that. It copies the file's HEAD version back into the staging area, so the file is no longer staged. The working tree is untouched: your edits stay in the file, now listed as "not staged".

Without `--staged`, `restore` changes the file on disk instead (the previous lesson). With `--staged`, only the staging area changes, so your edits on disk are safe.

## Try it

1. Two files were staged: `post.md` and `draft.md`. Look at what is staged.
2. The draft is not ready to be committed. Run `git restore --staged draft.md`.
3. Check the status. `post.md` is still staged; `draft.md` is modified but not staged.
4. Look at the staged changes again and confirm only `post.md` is in them.

## What just happened

In the strip under the graph, `draft.md` moved from the staging column back to the working-tree column, with the same content it had. The next commit will contain `post.md` only.
