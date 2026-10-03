Switching rewrites the files that differ between the two branches. What happens to edits you have not committed yet depends on whether they are in the way.

- If the edited file is **identical** in both branches, git has no reason to touch it. The edit stays on disk and comes along to the new branch.
- If the edited file **differs** between the branches, switching would have to overwrite your edit. Git refuses: "Your local changes to the following files would be overwritten by checkout". Nothing changes.

When git refuses, you choose: commit the edit where you are, throw it away with a restore, or force the matter. `git switch --discard-changes <branch>` throws away **all** your uncommitted edits to tracked files, not only the ones in the way, and switches. `git switch -m <branch>` (merge) tries to merge your edit into the other branch's version of the file; if both changed the same lines, you are left with a conflict to resolve (section 6). Both are for when you know what you are doing.

## Try it

Three short scenarios, in order.

1. **An edit that travels.** On `main`, add a line to `README.md`. Switch to `winter`. Check the status: the edit is still there, now on `winter`.
2. **An edit git blocks.** On `winter`, add a line to `trails/lake.md`, for example `- Check ice reports first`. Try to switch to `main` and read the refusal.
3. **A safe fix.** Either commit the lake edit on `winter`, or take the edit back with a restore. Then switch to `main`.
4. Answer the question in the lesson panel.

## What just happened

Git protects uncommitted work by refusing, not by stashing it somewhere. The README edit crossed branches twice without complaint because no version of README.md was in its way. The lake edit could not, because `winter` and `main` disagree about that file. Section 8 adds a fourth option for this situation: stashing.
