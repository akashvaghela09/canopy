Git's own diff and conflict markers are plain text. `git difftool` and `git mergetool` hand the same job to an external program: a graphical diff viewer, a three-way merge editor, or any script you write. Git knows many tools by name (`vimdiff`, `meld`, `kdiff3`, `p4merge`), and you can register your own with a few config keys:

```
git config diff.tool <name>
git config difftool.<name>.cmd '<command> "$LOCAL" "$REMOTE"'
git config merge.tool <name>
git config mergetool.<name>.cmd '<command> "$BASE" "$LOCAL" "$REMOTE" "$MERGED"'
git config mergetool.<name>.trustExitCode true
```

Git sets `$LOCAL`, `$REMOTE`, `$BASE` and `$MERGED` to temporary files before running the command. For a merge tool with `trustExitCode true`, writing the resolved content to `$MERGED` and exiting 0 marks the conflict as resolved (without it, git checks whether `$MERGED` changed). `-y` skips the "launch this tool?" prompt. `mergetool.keepBackup false` stops git from leaving `.orig` files behind.

## Try it

This lesson ships two small scripts in `tools/`: `canopy-diff` shows two versions side by side, `canopy-merge` resolves a conflict by keeping the lines from both sides. Read them first.

1. Register `canopy` as the diff tool using `tools/canopy-diff`. Git runs tool commands from the top of the working tree, so the relative path works: `git config difftool.canopy.cmd 'tools/canopy-diff "$LOCAL" "$REMOTE"'`. Run `git difftool -y main feature`.
2. Register `canopy` as the merge tool using `tools/canopy-merge`, trust its exit code, and turn off backup files.
3. Merge `feature` into `main`. It conflicts in `greeting.txt`. Resolve it with `git mergetool -y`, look at the file, and commit the merge.

## What just happened

`mergetool` extracted the base, ours and theirs versions to temporary files, ran your script, and took whatever it wrote to `$MERGED` as the resolution. A real tool shows the same three versions in a window; the plumbing is identical, which is why any program that can read and write files can be a merge tool.
