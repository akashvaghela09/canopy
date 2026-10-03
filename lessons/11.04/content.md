Blame is only as honest as the history. A commit that re-indents a file makes every line look like it was written that day, and a commit that moves a function to another file makes the mover its author. Blame has options for both.

```
git blame -w pricer/discounts.py
git blame --ignore-rev <id> pricer/discounts.py
git blame --ignore-revs-file .git-blame-ignore-revs pricer/discounts.py
git blame -C pricer/format.py
```

- `-w` ignores whitespace-only changes when deciding who changed a line.
- `--ignore-rev <id>` skips one commit entirely and attributes its lines to whoever changed them before. `--ignore-revs-file` reads a list of such ids from a file (one full 40-character id per line), which projects commit as `.git-blame-ignore-revs` so everyone skips the same formatting commits. Projects usually also set `git config blame.ignoreRevsFile .git-blame-ignore-revs` once, so plain `git blame` skips them.
- `-M` detects lines moved within a file; `-C` also detects lines copied or moved from other files changed in the same commit, and credits the original author.

## Try it

1. Blame `pricer/discounts.py`. Who does it credit for the `"SUMMER": 15,` line?
2. Blame again with `-w`. Now who?
3. Take the id of the reformat commit and blame with `--ignore-rev`. Then write its full id into a file called `.git-blame-ignore-revs` and use `--ignore-revs-file`.
4. Blame `pricer/format.py` plain, then with `-C`. The function was moved there from `cart.py`.
5. Answer the questions in the lesson panel.

## What just happened

Each option changes the question blame answers. Plain blame: "which commit last produced this exact line?" With `-w` or ignored revs: "who last changed what this line says?" With `-C`: "who wrote this line, wherever it lived before?"
