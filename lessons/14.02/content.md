Git stores content under a name made from the content itself: the SHA-1 of the bytes plus a small header. The same bytes always get the same id, no matter which file they came from or who ran the command. That is what "content-addressable" means.

`git hash-object <file>` prints the id a file would get. With `-w` it also writes the object into `.git/objects`.

## Try it

1. Three untracked files are waiting: `seeds-a.txt`, `seeds-b.txt` and `seeds-c.txt`. Look at their content.
2. `git hash-object seeds-a.txt seeds-b.txt` and compare the two ids.
3. `git hash-object seeds-c.txt` and compare again.
4. Store one of them: `git hash-object -w seeds-a.txt`.
5. Find the new file under `.git/objects`. Its folder is the first two characters of the id; the file name is the rest. Store `seeds-c.txt` the same way.
6. Answer the questions in the lesson panel.

## What just happened

Two files with identical content became one object. Git never stores the same content twice, and the id tells you what you have before you even open it. Note that the id is not the plain SHA-1 of the file: git hashes `blob <size>\0` followed by the content. `sha1sum seeds-a.txt` gives a different number.
