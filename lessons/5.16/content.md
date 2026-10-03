This lesson deletes a tag; the name is gone afterwards, though the commit it pointed to stays.

Tags do not move on their own, but you can move or remove them.

```
git tag -d <name>
```

deletes a tag.

```
git tag -f <name> <commit>
```

creates the tag again on another commit, replacing the old one. Add `-a -m "..."` to keep it annotated.

Do this only for tags that have not left your machine. Once a tag has been pushed, other people's clones keep the old meaning: `git fetch` does not update a tag that has moved, so `v1.0` would name one commit for you and another for everyone else. The convention is that a published tag is permanent; if the release was wrong, make a `v1.0.1`.

## Try it

1. List the tags. There is a stray lightweight tag called `scratch` and the release tag `v1.0`.
2. Show `v1.0`. It was put on "Add lake loop trail" by mistake; the release is the current tip of `main`, "Add gear checklist".
3. Delete `scratch`.
4. Move `v1.0` to the current commit, keeping it annotated, with the message `Trail guide 1.0`.
5. List the tags again and show `v1.0` to confirm.
6. Answer the question in the lesson panel.

## What just happened

`v1.0` now names a new tag object pointing at the right commit; the old one is no longer referenced. The `scratch` name is gone. Nothing happened to any commit. Because nobody else had these tags, the fix was free; after a push it would not be.
