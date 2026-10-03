`git gc` does everything at once and can take a while on a big repository. `git maintenance` splits the work into small tasks that are safe to run often, each with its own command:

- `--task=commit-graph`: write a commit-graph file, which makes `log`, `merge-base` and reachability questions much faster,
- `--task=loose-objects`: pack loose objects in batches (first run packs them, the next run deletes the loose copies that are now packed),
- `--task=incremental-repack`: fold small packs together behind a multi-pack index,
- `--task=prefetch`: fetch from remotes into `refs/prefetch/` so the next real fetch is quick,
- `--task=gc`: the full gc.

`git maintenance start` would run these on a schedule by registering a job with your operating system (cron or systemd timers, launchd, or the Windows scheduler). That reaches outside this learning folder, so this lesson explains it and does not run it. If you ever run it by accident, `git maintenance stop` removes the scheduled job again.

## Try it

1. Count the objects: 91, all loose.
2. `git maintenance run --task=commit-graph`, then look in `.git/objects/info/`.
3. `git maintenance run --task=loose-objects` and count again: still 91 loose, and now 91 in a pack.
4. Run the same task once more and count: 0 loose.
5. Answer the questions in the lesson panel.

## What just happened

Each task did one bounded job. The two-step loose-objects behaviour is deliberate: a concurrent command might still be writing one of those loose files, so git deletes them only after a whole run has passed with them safely in a pack.
