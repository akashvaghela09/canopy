Every commit has an id: 40 hexadecimal characters, computed from the commit's content. Two different commits never share an id, and the same commit has the same id on every computer.

Nobody types 40 characters. Git accepts any **prefix** of an id, as long as it is at least 4 characters long and nothing else stored in the repo starts with it. Git picks the length the compact log prints for you: 7 characters in most projects, more in very large ones. In a small repo like this one, 4 is usually enough.

A prefix shorter than 4 characters is not treated as an id at all: git stops with "ambiguous argument ... unknown revision". If a longer prefix matches more than one object, git says the short id "is ambiguous" and lists the candidates.

## Try it

1. List the history one line per commit and pick any commit.
2. Show that commit using only the first 4 characters of its id.
3. Try again with only the first 3 characters and read the error.
4. Show the same commit with its full 40-character id (`git log` without `--oneline` prints full ids).
5. Answer the questions in the lesson panel.

## What just happened

A short id is a shortcut, not a different name. Git expands it to the full id before doing anything. That is why 4 characters work in a small repo, while git prints longer ids in very large projects. `git log --oneline --abbrev=4` prints every id at the shortest length that is still unique.
