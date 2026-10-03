A patch file is a commit written out as text: the message, the author, the date and the diff. You can mail it, attach it to a ticket, or move it on a USB stick. Receiving it recreates the commit.

- `git format-patch <range> -o <dir>`: one file per commit, numbered in order, named after the subject line,
- `git format-patch -N`: the last N commits,
- `git apply --stat <patch>`: summarise what a patch touches,
- `git apply --check <patch>`: test whether it applies cleanly, changing nothing.

## Try it

1. `feature` has three commits that `main` does not. Export them: `git format-patch main..feature -o patches`.
2. Read one of the files in `patches/`. Find the headers, the message and the diff.
3. Go to `../colleague`, a clone that only has `main`. Summarise the patches with `git apply --stat ../project/patches/*.patch`.
4. Test them with `git apply --check ../project/patches/*.patch`. Silence means they all apply. Come back to `project`.

## What just happened

The three files carry everything needed to recreate the commits, author and message included, without either repository talking to the other. The next lesson applies them.
