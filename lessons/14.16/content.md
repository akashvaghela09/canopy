A three-way merge needs three inputs: the two tips and their **merge base**, the newest commit both can reach. For each file, git compares each side with the base; changes from only one side are taken, and changes from both sides to the same lines are a conflict.

Since git 2.38 you can run that computation without touching your branch or working tree:

- `git merge-base A B`: print the merge base,
- `git merge-tree --write-tree A B`: merge A and B in memory, write the result as a tree object and print its id. If there are conflicts, the exit code is 1 and the conflicted paths are listed after the tree id.

## Try it

1. Find the merge base of `main` and `spicy`.
2. Preview the merge: `git merge-tree --write-tree main spicy`. Read the first line (the tree id), the conflicted file, and the messages below.
3. The result tree is a real object. List it, and find the blob id of `notes.md` in it. Print that blob: both sides' changes to `notes.md` are in, because they touched different lines.
4. Check the status and the graph: nothing moved.
5. Answer the questions in the lesson panel.

## What just happened

`git merge` is this computation followed by checking the result out and writing a commit. `merge-tree` stops after the computation, which makes it the tool for "would this merge conflict?" without a scratch branch, and the engine behind server-side merge buttons.
