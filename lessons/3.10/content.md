A full patch is often more than you want. These options change what `git diff` prints; they work for commits and for your working tree alike.

- `--stat`: one line per file with how many lines changed.
- `--name-only`: only the file names.
- `--name-status`: file names with a letter: `A` added, `M` modified, `D` deleted, `R` renamed (a rename shows as `R` plus how similar the two versions are, e.g. `R100`).
- `-w`: ignore changes that are only whitespace. It changes the patch and `--stat`; `--name-only` still lists the file.
- `--color-words`: highlight the changed words inside a line instead of whole lines.

## Try it

1. Run `git diff --stat v0.1 v1.0`. Notice which files are listed and which are not.
2. Run `git diff HEAD~5 HEAD~3`, then the same with `-w`. One of the two files disappears: it changed only in spacing.
3. Run `git diff --name-status HEAD~7 HEAD~6` and read the letter in front of the menu file.
4. Try `--color-words` on `git diff v1.0 HEAD` to see the price changes word by word.
5. Answer the questions in the lesson panel.

## What just happened

The comparison is the same each time; only the report changes. `--stat` and `--name-*` are for overview, `-w` and `--color-words` are for reading a change without noise. Pick the one that answers the question you have.
