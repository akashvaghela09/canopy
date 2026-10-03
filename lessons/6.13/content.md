The default conflict markers show two versions and leave out the third one that matters: what the line looked like before either side touched it. Without it you cannot always tell *which* part each side changed.

Git can include the base in the markers:

```
<<<<<<< ours
your side
||||||| base
the common ancestor
=======
their side
>>>>>>> theirs
```

`git checkout --conflict` labels the sections `ours`, `base` and `theirs`. During a merge with the config set, they show `HEAD`, the base commit's id and the branch name instead.

Two ways to get it:

- For a file that is already conflicted: `git checkout --conflict=diff3 <file>` rewrites the file with fresh markers in this style. (`git restore --conflict=diff3 <file>` does the same.)
- For every future merge: set the config key `merge.conflictstyle` to `diff3`. Git 2.35 and newer also accept `zdiff3`, which trims lines that both sides changed the same way out of the hunk.

## Try it

1. Merge `rename` into `main`. `config.ini` conflicts, and the hunk contains two lines on each side.
2. Read the markers and try to answer: which line did `main` change, and which did `rename` change? The default markers do not say.
3. Run `git checkout --conflict=diff3 config.ini` and read the file again. Now the base section settles it.
4. Set `merge.conflictstyle` to `diff3` in this repo's config, so the next conflict shows the base from the start.
5. Resolve the file keeping both changes: the new name from `rename` and the new hours from `main`. Stage it and commit the merge.

## What just happened

Both sides changed neighbouring lines, so git could not merge them line by line and showed the whole block from each side. The base section turns "two different blocks" into "two small changes to one block", which is something you can combine with confidence.
