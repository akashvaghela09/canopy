A force-push replaces a branch on the server with whatever you have, even if that throws away commits other people pushed. It is sometimes necessary on a branch that only you work on, after a rebase. On a shared branch it is almost always a mistake. Most teams write the rule down:

- `main` and release branches are never force-pushed. Servers can refuse it: the config `receive.denyNonFastForwards` makes a bare repo reject any push that is not a fast-forward.
- Your own feature branches may be rewritten, but only with `--force-with-lease`, which fails if someone pushed in the meantime.
- If a force-push did go wrong, do not panic. Every clone that fetched before the mistake still has the old tip, and `origin/main`'s reflog in each clone remembers where it was.

## Try it

1. Press "Sam force-pushes main" in the lesson panel. Sam meant to rewrite his own branch and rewrote `main` instead.
2. Fetch, and compare `main` with `origin/main`. Two commits are missing from origin and one new one appeared. The reflog of `origin/main` shows the change.
3. Your `main` still holds the correct tip. Put it back on origin, using the lease form of a forced push so that you cannot repeat Sam's mistake on top of someone else's push.
4. Now that `main` is repaired, protect origin (once this is on, even a repair like yours is refused): `git -C ../origin.git config receive.denyNonFastForwards true`. From now on the bare repo refuses rewrites of any branch. Press the button again if you want to see Sam's retry refused.
5. Answer the question in the lesson panel.

## What just happened

Nothing was lost, because a force-push only moves a pointer on the server; the commits stayed in every clone that had them. Sam's table commit is still in Sam's clone and can be redone on top of the restored `main`. The server setting turns the policy into something git enforces.
