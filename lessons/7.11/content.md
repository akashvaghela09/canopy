Priya published a branch called `signage`. To work on it you need a local branch that starts where hers is and tracks it. Once your clone knows about `origin/signage`, one command does all of that:

```
git switch <name>                       if origin/<name> exists and no local <name> does:
                                        create local <name> from it, tracking it
git switch --track origin/<name>        the same, spelled out
git switch -c <name> origin/<name>      choose the local name yourself
```

The short form only works when exactly one remote has a branch with that name, which is the usual case.

## Try it

1. Run `git switch signage`. It fails: your clone does not know that branch yet.
2. Fetch, then look at the remote branches. `origin/signage` is there now.
3. Run `git switch signage` again. Read the message: git created the branch and set it to track `origin/signage`.
4. Check which upstream `signage` has.
5. Add your name as a line under the volunteer list in `trails/signage.md` and commit. Your commit sits on `signage`, one ahead of `origin/signage`.

## What just happened

A remote-tracking branch is read-only, so git made you a local `signage` at the same commit and linked the two. From here the branch behaves like `main`: commit, pull, push. Had a local `signage` already existed, `git switch signage` would have switched to it without touching the remote at all.
