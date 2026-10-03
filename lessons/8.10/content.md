No steps this time, only goals.

You are halfway through the CSV export feature: `app.py` has uncommitted edits and there is a new, untracked `export.py`. A bug report comes in: `area` in `lib.py` returns `3.14 * r`; it must be `3.14 * r * r`.

Fix the bug on `main` in a commit of its own that touches only `lib.py`. Your feature work must survive: when you are done, `app.py` still has its edits, `export.py` is still there, and neither is committed anywhere. Stash or worktree, your choice.
