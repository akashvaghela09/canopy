Conflicts are not bad luck. They come from two changes touching the same lines, and most of them can be avoided by how you work:

- **Small commits, synced often.** The less time between your branch and `main`, the less can collide.
- **Keep reformatting separate.** A commit that re-indents a whole file changes every line, so it conflicts with any other edit to that file. Do the reformat alone, merge it quickly, and build on top.
- **Do not touch what you do not need.** Leave unrelated lines, whitespace and import order alone.
- **Check whitespace before committing.** `git diff --check` lists trailing whitespace and conflict-marker-like lines in your unstaged changes (`git diff --check --cached` for staged ones). Stray whitespace edits are hard to see in your editor, and each one is a changed line that can conflict with someone else's work.

## Try it

Two branches add the same search command to `src/cli.js`. `wide` also re-indented the whole file; `narrow` only inserted the new lines. Meanwhile Sam changed the usage line on `main`.

1. You start on `narrow`, and README.md has an unstaged edit waiting. Run `git diff --check`, fix what it reports, and commit the edit.
2. Switch to `wide` and merge `main` into it. Resolve the conflict so that the file keeps the four-space indentation, the search command, and Sam's new usage text. Commit the merge.
3. Switch to `narrow` and merge `main` into it. Watch what happens.
4. Answer the two questions in the lesson panel.

## What just happened

The same feature caused a conflict on one branch and none on the other. The only difference was the reformat riding along in the same commit. Keeping unrelated changes apart, and checking whitespace before committing, prevents most conflicts you would otherwise spend time resolving.
