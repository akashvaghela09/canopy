`git am` ("apply mailbox") turns patch files back into commits, keeping the original author, date and message. It applies them in order and stops at the first one that does not apply.

- `git am <patches>`: apply a series,
- `git am -3`: on failure, fall back to a three-way merge using the blob ids in the patch, which leaves conflict markers you can resolve,
- `git am --continue` after resolving, `git am --skip` to drop a patch, `git am --abort` to undo the whole run.

## Try it

1. Three patches from upstream are in `../patches`. Your repository has a local commit that changed the same line one of them changes.
2. Apply them with the three-way fallback: `git am -3 ../patches/*.patch`. The first applies; the second stops with a conflict in `config.txt`, and the prompt shows `AM` while the session is open.
3. Resolve it: keep upstream's `level = 2`, stage the file, then `git am --continue`. The third patch applies on its own.
4. Read the log. The three new commits carry Sam's name, not yours.

## What just happened

Without `-3`, `am` has only the patch text and gives up as soon as the context does not match. With `-3`, it rebuilds the pre-image from the blob ids in the patch (which works because your repository shares that history) and merges, exactly like a cherry-pick. The result is Sam's commits on top of yours, with new ids.
