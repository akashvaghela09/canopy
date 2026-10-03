A fresh repository stores each object as its own compressed file: a **loose object**. That is simple but wasteful: twelve versions of a log file that differ by one line are stored twelve times in full.

A **packfile** stores many objects in one file and can store an object as a **delta**: the difference from another object. `git gc` builds packs; git also packs automatically when there are many loose objects. Push and fetch send objects as a pack, and large transfers are kept as packs.

- `git count-objects -v`: how many objects are loose (`count`) and packed (`in-pack`),
- `git gc`: pack loose objects (and tidy up refs and reflogs),
- `git verify-pack -v <pack.idx>`: list the objects in a pack, with delta information.

## Try it

1. Count the objects. Every one of them is loose right now.
2. Look at `.git/objects/`: dozens of two-character folders.
3. Run `git gc`, then count again. Look at `.git/objects/pack/`.
4. List the pack: `git verify-pack -v .git/objects/pack/*.idx`. Most blobs now show a tiny size (a few bytes) and two extra fields at the end, a depth and a base id: they are stored as deltas against another version of the same file. The base is the newest version of `log.txt`; git keeps the latest version whole and stores older ones as differences.
5. Answer the questions in the lesson panel.

## What just happened

Nothing about the history changed; `cat-file` still returns every object. Only the storage changed, from one file per object to one file for all, with deltas between similar versions. The Objects box in the .git tab still finds every object by id.
