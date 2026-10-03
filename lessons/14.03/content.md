Every object in `.git/objects` is compressed, so you cannot read it with `cat`. `git cat-file` is the reader. Give it an id and ask one question at a time:

- `git cat-file -t <id>`: the type (`blob`, `tree`, `commit` or `tag`),
- `git cat-file -s <id>`: the size in bytes,
- `git cat-file -p <id>`: the content, pretty-printed for the type.

A **blob** is the content of one file, nothing else: no name, no mode, no date.

## Try it

1. Ask for the type of `0d4542a`, then of `5ce004c`, then of `ec5cadf`.
2. Ask for the size of `ec5cadf`. Compare it with `wc -c README.md`.
3. Print the content of `7aec562` and read the third line.
4. Answer the questions in the lesson panel.

## What just happened

The three ids were a tree, a commit and a blob, and `cat-file` could tell them apart from the header stored with each object. The blob for `README.md` is exactly as large as the file, because a blob stores content and nothing more.
