A **bundle** is a repository, or a slice of one, in a single file. It carries commits and refs, and git treats the file like a remote: you can clone from it and fetch from it. No server, no network.

- `git bundle create <file> <refs or range>`: write the bundle (`--all` for everything, `A..B` for only the commits after A),
- `git bundle verify <file>`: check it is complete relative to this repository,
- `git bundle list-heads <file>`: list the refs it carries,
- cloning or fetching with the file path as the URL reads it.

## Try it

1. Bundle everything into the lesson folder: `git bundle create ../full.bundle --all`. Verify it and list its heads.
2. From the lesson folder, clone `full.bundle` into `offline` the usual way. The tag `v1.0` came along.
3. Back in `project`, add a file of your choice and commit it, so there is something new to send.
4. Make a smaller bundle with only the commits after v1.0: `git bundle create ../update.bundle v1.0..main`. June and July go again, which is harmless; a bundle only needs its base to exist on the other side. Compare its size with the full one.
5. In `offline`, fetch `main` from `../update.bundle` and merge it (or pull in one step). The offline copy is now level with `project`.

## What just happened

The first file was a complete transfer; the second carried only the commits after a point the other side already had, because you named that point. Push does the same negotiation automatically, over a connection instead of a file.
