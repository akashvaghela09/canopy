This lesson deliberately destroys a lost commit so you can see where the safety net ends. Nothing else in the repo is affected.

Reflog entries do not live forever. Two settings decide how long:

- `gc.reflogExpire` (default **90 days**): entries for commits that are still reachable from the branch.
- `gc.reflogExpireUnreachable` (default **30 days**): entries for commits that are no longer in that ref's current history, which includes the "lost" kind.

Two separate steps remove a lost commit for good. `git reflog expire` drops the old entries, and `git gc --prune=<date>` deletes objects that nothing points to (by default it spares objects written in the last two weeks, `gc.pruneExpire`). `git gc` runs the expire step for you, using the settings above. You can shorten the clock in one repo:

```
git config gc.reflogExpireUnreachable now
git gc --prune=now
```

Do this only in a throwaway repo like this one.

## Try it

1. Read the reflog: a commit was dropped by a reset and still sits at `HEAD@{1}`. Show it and keep its id.
2. Set `gc.reflogExpireUnreachable` to `now` in this repo's local config (or run `reflog expire` with `--expire-unreachable=now --all`).
3. Run `git gc --prune=now`.
4. Try to show the old id again. Read the reflog again. The gray commit is gone from the graph too.
5. Answer the questions in the lesson panel.

## What just happened

With the defaults, a dropped commit stays in the reflog for about 30 days. After that, the next `gc` deletes it, unless its object file is less than two weeks old (`gc.pruneExpire`). Git runs `gc` on its own now and then, so treat the reflog as a month-long net, and recover things when you notice, not later.

You may have noticed that the whole reflog is empty now. This repo's entries were written in 2024, so all of them were already older than both defaults; `git gc --prune=now` alone would have removed the lost commit here. In a repo you work in today, the entry is days old, and step 2 is what lets `gc` remove it.
