This lesson discards an uncommitted edit to `gear.md` on purpose; the edit is one you make here and will not need.

Before git 2.23 there was no `switch` and no `restore`. One command, `checkout`, did both jobs, and you will still meet it everywhere: in older tutorials, in scripts, and in the habits of people who learned git years ago. Each old form has a newer twin:

| Older form | Does the same as |
|---|---|
| `git checkout <branch>` | `git switch <branch>` |
| `git checkout -b <name>` | `git switch -c <name>` |
| `git checkout <commit>` | `git switch --detach <commit>` (next lessons) |
| `git checkout -- <file>` | `git restore <file>` |

The split happened because one word was doing two unrelated things: moving HEAD, and overwriting a file on disk. `git checkout notes` meant "switch to the branch notes" if such a branch existed, and "throw away my edits to the file notes" if not. The `--` separates the two readings. `switch` and `restore` cannot be confused like that.

## Try it

1. Move to the branch `winter` using `checkout`.
2. Create a branch `winter-gear` from there and switch to it, again with `checkout`.
3. Add a line to `gear.md`, for example `- spikes`, and check the status.
4. Throw that edit away with `git checkout -- gear.md`. The status is clean again.
5. Answer the questions in the lesson panel.

## What just happened

Three checkout commands, three different effects: HEAD moved, a branch was created, and a file was overwritten. The result is identical to what `switch`, `switch -c` and `restore` would have done. Prefer the newer commands in your own work; read `checkout` fluently in everyone else's.
