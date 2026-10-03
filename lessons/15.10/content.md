`git archive` writes the files of one commit into a tar or zip file, without the `.git` folder and without anything you mark as development-only. That is how release downloads are made.

- `git archive --format=tar.gz -o <file> <commit-or-tag>`: write the archive,
- `--prefix=name/`: put everything under one top folder,
- `export-ignore` in `.gitattributes`: leave a path out of archives.

The attributes come from the commit being archived, not from your working tree, so commit `.gitattributes` first.

## Try it

1. Mark `tests/` and `notes/` as `export-ignore` in `.gitattributes`. Commit it.
2. Create an annotated tag `v2.0` for the release.
3. Write the archive: `git archive --format=tar.gz --prefix=app-2.0/ -o app-2.0.tar.gz v2.0`.
4. List it with `tar tzf app-2.0.tar.gz`: `README.md` and `src/` under `app-2.0/`, nothing from `tests/` or `notes/`.
5. Answer the question in the lesson panel.

## What just happened

The tag names an exact tree; the archive is that tree, filtered by the attributes stored in it, flattened into one file. Anyone with the tag can regenerate an archive with exactly the same files.
