Two ways to bring a stash back into the working tree:

```
git stash pop            apply the newest entry, then delete it from the list
git stash apply          apply it, but keep the entry
git stash apply stash@{2}   any entry, by name (pop takes a name too)
```

Use `pop` for the normal case: the work comes back and the entry is gone. Use `apply` when you want to keep the entry, for example a set of debugging edits you re-apply again and again. Entries you no longer need are removed with `git stash drop <entry>`; `git stash clear` removes all of them. Changes come back unstaged; add `--index` to restore what was staged as staged.

## Try it

1. List the stashes. `stash@{0}` holds a half-written greeting change; `stash@{1}` holds debug settings in `config.toml` that you like to switch on now and then.
2. Apply the debug settings with `apply`, naming the entry. Check `config.toml` and the stash list: the entry is still there.
3. Bring the greeting back with `pop`. Check the stash list again: that entry is gone.
4. Check the status: both files are modified, and exactly one stash remains.

## What just happened

`apply` copied the changes out of the stash and left the entry in place; `pop` is `apply` followed by `drop`. If the apply stops on a conflict, `pop` keeps the entry too. That case has its own lesson.
