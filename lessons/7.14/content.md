`origin` is only a name. A clone can talk to any number of remotes, each with a name and a URL, and you can add, rename and remove them at will:

```
git remote add <name> <url>       add a remote
git remote rename <old> <new>     rename one (its <old>/* bookmarks are renamed too)
git remote remove <name>          forget one (and its bookmarks)
git remote get-url <name>         print the URL
git remote set-url <name> <url>   change the URL
```

The common case for a second remote is a fork: `origin` is your copy, and the project you forked from is usually called `upstream`. That name is only a convention. It has nothing to do with a branch's upstream from 7.09.

## Try it

1. List the remotes with their URLs. There are two: `origin`, and a `backup` whose folder no longer exists.
2. Add the club's main repository as a remote: `git remote add upstream ../upstream.git`.
3. Fetch from it. (Fetching from every remote at once would also try the dead `backup` and print an error for it.) Draw the graph: `upstream/main` is ahead of `origin/main`. Answer the question about how far.
4. Remove the dead `backup` remote.
5. Rename `origin` to `fork`, so the names say what the remotes are. List the remotes again and look at the graph: the bookmarks are now called `fork/main`.

## What just happened

Fetching from `upstream` created a second set of remote-tracking branches. Renaming `origin` renamed its bookmarks and updated the tracking link of `main` (look at `git branch -vv`). Nothing in the history changed; only the names your clone uses for the other repositories.
