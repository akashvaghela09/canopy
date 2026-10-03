The staging area is a single binary file, `.git/index`. It is a flat list: for every path, the mode, the id of the blob that holds the staged content, a stage number (0 unless there is a conflict), and cached file details such as size and modification time, so git can spot changed files quickly. The next commit's tree is built from this list.

`git ls-files -s` prints the list. `git update-index` edits it directly: `git update-index --add <file>` writes the blob and records it, which is what staging does.

## Try it

1. `git ls-files -s` and count the entries. List the files of HEAD recursively and compare: the same four blobs.
2. Stage `notes.txt` the way you normally would, then list the index again. Find the new line and its blob id.
3. Confirm that the blob exists: type its id into the Objects box of the .git tab, or print it with `cat-file -p`. The Index section of the .git tab shows the new entry too.
4. Stage `extra.txt` with plumbing: `git update-index --add extra.txt`. List the index once more.
5. Answer the questions in the lesson panel.

## What just happened

Staging did two things: it wrote a blob into `objects/` and recorded the blob's id against the path in the index. `git add` is a friendly front for exactly that. The working tree was not involved beyond reading the file.
