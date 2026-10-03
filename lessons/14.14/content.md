This lesson deletes two unreachable commits for good; nothing on `main` is affected.

An object you cannot reach by following links from any ref, reflog entry or the index is **unreachable**. `git gc` does not delete it straight away. Git keeps unreachable objects for a grace period (two weeks, `gc.pruneExpire`), measured from the object file's modification time, so a command that is still running, or a mistake you notice tomorrow, can still find them.

- `git gc`: repack, expire old reflog entries, prune unreachable objects older than the grace period,
- `git gc --prune=now`: prune them regardless of age,
- `git prune`: delete unreachable loose objects (with no grace period unless you pass `--expire`),
- `git repack -a -d`: rewrite everything reachable into one pack and delete the old packs. Unreachable objects that were only in those packs are gone at once, with no grace period, which is why `gc` itself uses a gentler form,
- `git gc --aggressive`: spend much longer searching for better deltas. Rarely worth it; the normal pack is already good.

## Try it

1. Two commits from a deleted `scratch` branch are still in the object store. List the unreachable objects and count all objects with `count-objects -v`.
2. Run a plain `git gc`. Count again and list the unreachable objects again. They are all still there: git 2.41 and later moves them into a separate "cruft" pack, older versions leave them loose.
3. Run `git gc --prune=now`. Count once more: the objects are gone.
4. Answer the questions in the lesson panel.

## What just happened

Garbage collection is reachability plus patience. Section 10 showed how the reflog keeps commits reachable for a while; this is the step after that, when nothing points to them any more and the grace period runs out.
