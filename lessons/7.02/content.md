Your clone keeps a short record of its remote: a name, a URL, and the branches it last saw there. A few commands read that record, and one asks the remote directly.

```
git remote -v              name and URL of every remote
git remote show origin     details: URL, remote branches, what your branches track
git branch -r              remote branches your clone knows about
git branch -a              local and remote branches together
git ls-remote origin       ask the remote what it has right now
```

`origin/HEAD -> origin/main` in the branch lists is not a branch: it records which branch is the remote's default.

`remote -v`, `branch -r` and `branch -a` read local information only. `remote show origin` and `ls-remote` contact the remote, so they also see changes nobody has fetched yet.

## Try it

1. Show the URL of `origin`. Answer the first question.
2. List the remote branches your clone knows about, then list all branches. Answer the second question.
3. Ask the remote itself with `git ls-remote origin`. One branch shows up here that your clone has not seen yet. Answer the third question.

## What just happened

A teammate pushed a new branch after you cloned. Your clone's picture of the remote is a snapshot from the last time it talked to the remote; it does not update by itself. `ls-remote` showed the live state. The next lessons teach how to bring that work into your clone.
