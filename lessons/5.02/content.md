Creating a branch adds a new label. It does not move HEAD and it does not change any file.

```
git branch <name>
```

creates a branch pointing at the commit HEAD is on.

```
git branch <name> <start>
```

creates it at another commit instead: an id, a tag, `HEAD~2`, another branch name.

Names can contain `/`, and many teams use that for grouping: `fix/lake-distance`, `feature/map`. A few things are not allowed: spaces, `..`, `~`, `^`, `:`, a name that ends in `/` or `.lock`. Git refuses those with "not a valid branch name". And because `fix/lake-distance` is stored like a file inside a folder `fix`, a branch named plain `fix` and a branch `fix/...` cannot both exist.

## Try it

1. Create a branch `signage` at the current commit.
2. Create a branch `fix/lake-distance` at the commit "Add lake loop trail", one commit below HEAD.
3. Try `git branch bad..name` and read the refusal.
4. List the branches with their tips. Note that you are still on `main` and HEAD has not moved.
5. Add a line to `gear.md` and make a commit on `main`.
6. List the branches again and answer the question in the lesson panel.

## What just happened

Two new flags appeared in the graph, and the graph did not change shape. After your commit, `main` moved forward and the other two labels stayed where they were. A branch label only moves when you commit while HEAD is on it.
