This lesson throws away an uncommitted edit, a staged file and untracked clutter in the `inventory` folder.

A colleague left the `inventory` project in a mess before going on holiday, and the team has already pulled the newest commit:

- The newest commit, "Remove old tests", deleted `tests/test_inventory.py`. The tests were fine; they have to come back. Since the commit is shared, history must not be rewritten.
- A personal file was staged by accident. It should not be committed, and it should not be left lying in the project folder either.
- There are stray untracked files and a folder.
- `inventory.py` has an unfinished debugging edit that should be dropped.
- `inventory.log` is ignored on purpose and should stay where it is.

Bring the repo to a clean, correct state. The goals in the lesson panel describe the target; the order and the commands are up to you.
