Everything git knows about this repository lives in one hidden folder: `.git`. Nothing in it is magic. Most of it is plain text, and the rest is compressed content you can read with git's own tools.

The entries that matter:

- `HEAD`: a text file naming the branch you are on.
- `config`: settings for this repository only.
- `objects/`: every file, folder and commit, stored by its id.
- `refs/`: branches (`refs/heads/`) and tags (`refs/tags/`), one small file each.
- `index`: the staging area, a binary list of what the next commit will contain.
- `hooks/`: scripts git runs at certain moments, such as before a commit. The samples are inactive.
- `logs/`: the reflog, a record of where each branch and HEAD have pointed.

## Try it

1. `ls .git` and read the entry names.
2. Print the HEAD file and read which branch it names.
3. `ls .git/refs/heads` and `ls .git/objects`. The object folders are named after the first two characters of each id.
4. Open the **.git** tab next to the files panel. It has three sections: Refs (each ref and the short id it points to), Index (path, stage and blob id of each entry) and Objects (type an id or a name such as `HEAD^{tree}` and it prints the object).
5. Answer the questions in the lesson panel.

## What just happened

You read the repository's own bookkeeping. The rest of this section opens each of these entries in turn: objects, trees, commits, tags, the index and refs.
