Goals only. This lesson ends by removing a commit from `main` with a hard reset, so keep your working tree clean while you work.

Three feature branches are waiting to be integrated into `main`:

- `nav` adds a navigation bar. It was started from the current tip of `main` and should land without a merge commit.
- `search` adds a search box. It conflicts with `main` in `menu.md`: both sides changed the tea line. The resolved line must read `- Tea 2.20 (also iced)`, keeping the new price and the new note. This one needs a real merge commit.
- `analytics` is three small commits that should become a single commit on `main`, with the message `Add analytics`.

After all three are in, the team decides the analytics work is not ready for the site. Take that single commit off `main` again, so `main` has no `analytics.js`, but keep the `analytics` branch for later. Delete the two branches whose work is fully in `main`.

Finish on `main` with nothing in progress and a clean working tree.
