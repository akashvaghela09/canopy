A branch you create locally exists only in your clone. To share it, push it to the remote. The first push of a new branch should also set its upstream, so later pushes and pulls on that branch need no arguments:

```
git push -u origin <branch>
```

`-u` is short for `--set-upstream`. Without it, git pushes the branch (if you name it) but does not remember the link, and a plain `git push` on that branch keeps asking you to spell it out.

## Try it

1. Create a branch called `trail-maps` and switch to it.
2. Add a file `maps/README.md` with a line of text, and commit it.
3. Run a plain `git push`. Read the message: the branch has no upstream, and git tells you the command it wants.
4. Run `git push -u origin trail-maps`.
5. Check that `trail-maps` now has an upstream: `origin/trail-maps`. In the graph, `origin/trail-maps` appears next to your branch.

## What just happened

The push created `trail-maps` on the remote and sent your commit there; `-u` recorded `origin/trail-maps` as the branch's upstream. Teammates can now fetch and start from your branch, which is the next lesson from their side.
