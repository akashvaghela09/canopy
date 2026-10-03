A shallow clone downloads only the most recent commits. `git clone --depth 1` fetches the tip of the branch and nothing older. Build servers use it because a build needs the files, not ten years of history. The clone is a normal repository with one difference: the oldest commit it has is marked as a boundary in `.git/shallow`, and history stops there.

You can extend a shallow clone later:

- `git fetch --deepen <n>` fetches `n` more commits beyond the current boundary.
- `git fetch --depth <n>` sets the total depth to `n`.
- `git fetch --unshallow` fetches the complete history and removes the boundary.

Git ignores `--depth` for a plain local path, because a local clone copies objects directly. A `file://` URL goes through the normal transport, so this lesson clones that way.

## Try it

`origin.git` has twelve commits on `main`.

1. Clone it with history limited to one commit: `git clone --depth 1 "file://$PWD/origin.git" shallow`. Go inside and count the commits on `HEAD`.
2. Deepen the history by three commits and count again.
3. Fetch the full history with `--unshallow`. Count once more, and check that `.git/shallow` is gone.

## What just happened

The count went 1, then 4, then 12. Each fetch asked the server for older commits and the server sent exactly those. A shallow clone can push and pull like any other, but operations that need the whole history, such as `merge-base` with an old commit or `describe`, may fail until you deepen it.
