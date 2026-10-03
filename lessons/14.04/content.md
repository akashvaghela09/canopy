A **tree** is a folder. Each line of a tree names one entry: its mode, its type, its id and its name. Files point to blobs; subfolders point to other trees. A commit points to one root tree, and from there you can walk down to any file.

`git ls-tree <tree-or-commit>` lists one level. `-r` recurses into subfolders. Reading a tree with `cat-file -p` shows the same lines.

## Try it

1. `git ls-tree HEAD`. Count the entries and find the one that is a `tree`.
2. Copy that id and list it: `git ls-tree <id>`. You are now inside `docs/`.
3. Find the blob id of `guide.md`. Print that blob the way you learned last lesson: the output is the file's content.
4. Compare with `git ls-tree -r HEAD`, which walks the whole structure in one go.
5. Answer the questions in the lesson panel.

## What just happened

You followed the chain commit, root tree, `docs` tree, blob by hand. The graph draws commits only; to look inside a tree without the terminal, type its id into the Objects box of the .git tab. A tree's id depends on every id inside it, so changing one file changes its blob, its folder's tree, and every tree above it up to the root.
