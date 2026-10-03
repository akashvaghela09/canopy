Because every object is named by the hash of its content, git can always tell whether an object is intact: re-hash it and compare. `git fsck` does that for the whole repository and also checks that every reference points at something that exists.

- `git fsck`: check every object, loose and packed, and every ref (older guides add `--full`; that is the default now),
- `git fsck --lost-found`: write dangling objects into `.git/lost-found/` so you can look at them.

## Try it

1. Run `git fsck`. It reports one corrupt object and names its id.
2. Find out which file that blob belongs to: list the tree of HEAD recursively and match the id.
3. `../backup` is a clone made while the repository was healthy. Objects are content-addressed, so the healthy copy has the same name under `backup/.git/objects/`. Copy that file into this repository's `.git/objects/` folder.
4. Run `git fsck` again. Clean.
5. Answer the question in the lesson panel.

## What just happened

A corrupt object cannot hide: its content no longer hashes to its name. And because any other copy of the repository stores the same object under the same name, a clone is a complete backup of history. Fetching or pushing would not help: git thinks you already have the object and does not send it again. Copying the object, or a pack that contains it, from another clone is the standard repair. If you rebuild the object with `hash-object -w` instead, delete the damaged file first: git never overwrites an existing object file.
