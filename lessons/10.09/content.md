This repo lost three things weeks ago, and its reflog has since expired, so `git reflog` shows nothing useful. Two of the three can still be recovered.

Git stores every commit, tree and file version as an object in `.git/objects`. Refs and the reflog are only pointers into that store. An object that no ref and no reflog entry reaches is **unreachable**. The unreachable objects that not even another unreachable object points to (the top of each lost pile) are **dangling**. `fsck` lists both:

```
git fsck --lost-found
git fsck --unreachable
```

`--lost-found` prints dangling commits and blobs and also copies them into `.git/lost-found/commit/` and `.git/lost-found/other/`, named by id. `--unreachable` prints every unreachable object, including the trees and blobs inside a lost commit. `--lost-found` ignores the reflog, so in an everyday repo it also lists commits the reflog still remembers. `git show <id>` prints any of them: a commit as a patch, a blob as plain text.

The three losses:

1. A branch `ideas` was deleted; its one commit is now dangling.
2. `notes/scratch.md` was staged, then unstaged and deleted. Staging wrote a blob, so the blob is dangling.
3. `draft.md` was edited for an hour and never staged, then overwritten. Git never saw that content.

## Try it

1. Run `git fsck --lost-found`. Read the two lines it prints and look in `.git/lost-found/`.
2. Show the dangling commit; note its id for the question.
3. Show the dangling blob. It is the scratch file. Write its content back to `notes/scratch.md`.
4. Answer the questions in the lesson panel.

## What just happened

Staging is already a save: `git add` writes the file into the object store, and objects survive until a garbage collection prunes them. Editing without staging writes nothing, which is the one kind of loss git cannot undo.
