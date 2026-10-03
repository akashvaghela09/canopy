By default a stash takes only changes to tracked files. New files that git has never seen stay where they are, and so do ignored files. Three options change what goes in and what stays:

```
git stash -u              also take untracked files (long form: --include-untracked)
git stash --all           untracked and ignored files too
git stash --keep-index    stash everything, but leave the staging area as it is
```

`--keep-index` answers a common question: "do my staged changes work on their own?" Stash with it, run your tests on what is staged, then pop.

## Try it

1. Check the status: `app.py` and `config.toml` are modified, `notes/draft.md` is untracked, and `debug.log` is ignored.
2. Run a plain `git stash`. Check the status: the draft is still there. Pop the stash back.
3. Run `git stash -u`. Now the draft is gone too; `debug.log` is still on disk. (`git stash show` does not list untracked files; add `--include-untracked` to see them.) Pop it back.
4. Stage the `config.toml` change only. Then run `git stash push --keep-index`.
5. Check the status: `config.toml` is still staged, `app.py` is back to the committed version, and the stash holds both changes (the staged one is also still in place).

## What just happened

Untracked files are not in any commit yet, so a stash has to be told to include them. `--all` goes one step further and takes ignored files too; use it rarely, because build output and dependency folders can be large. `--keep-index` leaves the index exactly as it was, which is what you want for testing a commit before you make it.
