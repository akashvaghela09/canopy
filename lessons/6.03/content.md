A merge commit is a commit, so it has a message. Git prepares one for you, `Merge branch 'search'`, and opens the editor so you can change it. Three options control this:

- `git merge -m "<message>" <branch>` uses your text and does not open the editor.
- `git merge --no-edit <branch>` keeps the prepared message and does not open the editor.
- `git merge --edit <branch>` always opens the editor, even when a configuration or script would skip it.

A good merge message says what arrived and why, the same as any other commit message. The prepared text is fine when the branch name already says it.

## Try it

1. Draw the history: `search` and `theme` both forked from `main`, and `main` has moved on too.
2. Merge `search` with the message `Merge search feature into main`, using `-m`.
3. Merge `theme` and accept the prepared message without opening the editor.
4. Read the last two commits and compare the two messages.

## What just happened

Both merges made a merge commit; only the messages differ. When a merge needs no explanation, `--no-edit` saves a step. When it does, `-m` or the editor lets you say what the branch brought in.
