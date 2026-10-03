The default merge strategy (`ort` since git 2.34, `recursive` before) takes options with `-X`. They change how it matches content, not what it merges.

- `-X find-renames=<n>%`: treat a deleted and an added file as a rename when they are at least n% similar (default 50%),
- `-X patience`, `-X histogram`: different diff algorithms, better at matching moved blocks and repeated lines,
- `-X ignore-space-change`, `-X ours`, `-X theirs`: you met these earlier.

The same algorithms exist for viewing: `git diff --diff-algorithm=patience`, or `diff.algorithm` in your config.

## Try it

1. On `main`, `util.py` was moved to `lib/helpers.py` and heavily rewritten. On `fix`, the old `util.py` got a one-line fix. Try a plain merge of `fix`: a modify/delete conflict, because git did not see the rename. Abort it.
2. Measure the similarity: `git diff --find-renames=1% --name-status HEAD~1 HEAD` reports the rename with a percentage.
3. Merge again with the threshold lowered to that percentage: `git merge -X find-renames=20% fix`.
4. Read `lib/helpers.py`: the fix landed in the moved file.
5. Answer the question in the lesson panel.

## What just happened

Rename detection is a similarity guess, and heavy edits during a move can push a file below the default. Telling the strategy to accept a lower score let it see the move and carry the fix across. The merge commit is otherwise ordinary.
