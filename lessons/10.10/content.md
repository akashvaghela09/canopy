A stash called "wip: dark mode" was dropped by mistake. A stash entry is a commit (two or three, in fact: the working tree, the saved index, sometimes untracked files), and `stash drop` only removes it from the list. The commits are now dangling, and `fsck` can find them.

```
git fsck --unreachable | grep commit
git show -s <id>
git stash apply <id>
```

`stash apply` accepts any commit that looks like a stash, not only `stash@{n}`. Pick the commit whose message starts with "On main: wip: dark mode", not the one starting with "index on main"; that one is its saved staging area.

## Try it

1. Check the stash list. Only "wip: tooltips" is left.
2. List unreachable commits with `fsck` and show each one's message until you find the dark-mode stash.
3. Apply it by id.
4. Check the status: `styles.css` and `app.py` have the dark-mode edits again.

## What just happened

Dropping a stash prints its id for exactly this reason; copy it when you see it. Without the id, `fsck --unreachable` is the way back, as long as no garbage collection has pruned the objects. If you prefer the stash list to hold it again, `git stash store -m "wip: dark mode" <id>` puts it back there.
