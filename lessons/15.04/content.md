This lesson deletes the `lib` submodule and its cached clone from the project; the library itself in `lib.git` is untouched.

A submodule is recorded in four places: the gitlink in the tree, `.gitmodules`, `.git/config` (once initialised) and the cached clone in `.git/modules/<name>`. Removing it cleanly means clearing all four.

- `git submodule deinit <path>`: empty the working folder and remove the `.git/config` entry,
- removing the path from the project (the usual way to remove a tracked path): drops the gitlink and the `.gitmodules` entry, both staged,
- `rm -rf .git/modules/<name>`: delete the cached clone.

## Try it

1. `git submodule deinit lib`. Do this first: once the path is removed from the project, deinit no longer finds it. The folder is now empty and `git config --local --list` has no `submodule.lib` entry.
2. Remove `lib` from the project as you would any tracked path. Read `.gitmodules`: the section is gone.
3. Commit.
4. `ls .git/modules`: the library's clone is still there. Delete `.git/modules/lib`.
5. Answer the question in the lesson panel.

## What just happened

Each step cleared one place: `deinit` the config and working folder, the removal the tree and `.gitmodules`, the last `rm` the cache. Skipping the cache is harmless but wastes space, and it causes a confusing error if a submodule with the same name is ever added again.
