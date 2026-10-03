Everything this section has done with branches comes down to a few tiny text files inside `.git`.

- `.git/HEAD` holds one line: `ref: refs/heads/main`. That is how git knows which branch you are on.
- `.git/refs/heads/` holds one file per branch, named after the branch.
- Each of those files holds one line: the id of the commit the branch points to.

A branch is a 41-byte file. Creating a branch creates a file; switching rewrites `HEAD`; committing rewrites the current branch's file with the new id. Read them with `cat` and `ls`; do not edit them by hand.

## Try it

1. Print `.git/HEAD`.
2. List `.git/refs/heads` and print the file for `main`. Compare its content with the id of HEAD in the log.
3. Create a branch `notes` and list `.git/refs/heads` again.
4. Add a line to `README.md` and make a commit on `main`. Print the `main` file again.
5. Answer the questions in the lesson panel.

## What just happened

The `main` file changed to your new commit's id; the `notes` file still holds the old one. That is the whole mechanism behind "the label moved".

One detail for later: to save space, git sometimes collects these files into a single file, `.git/packed-refs`, one line per branch or tag. That happens after `git gc`, and a fresh clone writes most of its refs there. If a branch you know exists is missing from `refs/heads`, look in `packed-refs`. The branch behaves exactly the same either way.
