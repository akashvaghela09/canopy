Two options make stashes far more useful than the bare `git stash`:

```
git stash push -m "<message>"        name the entry so you recognise it later
git stash push -- <path> [<path>...] park only these files; everything else stays
```

They combine: `git stash push -m "export wip" -- app.py`. The `--` separates options from paths, the same way it does in other git commands.

## Try it

1. Check the status. Two files are modified: `app.py` has a half-done export feature you want to set aside, and `README.md` has a small fix you want to keep working on.
2. Stash only `app.py`, with a message that says what it is.
3. Check the status: only `README.md` is still modified. List the stashes: your message is there instead of `WIP on main`.
4. Show the stash to confirm it contains only `app.py`.

## What just happened

Stashing by path takes the named files out of the working tree and leaves the rest alone, so you can park one line of work without disturbing another. The message costs nothing now and saves you a round of `stash show` next week.
