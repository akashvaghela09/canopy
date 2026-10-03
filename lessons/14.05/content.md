A **commit** object is a short piece of text:

```
tree <id of the root tree>
parent <id of the previous commit>      (one line per parent; none for the first commit)
author Name <mail> <timestamp> <timezone>
committer Name <mail> <timestamp> <timezone>

The message
```

The commit's id is the hash of this text (with the same small `commit <size>` header that blobs get). The text includes the parent's id, and the parent's text includes its parent's id. That chain is why one id names a whole history: if anything earlier changed, every id after it would change.

## Try it

1. Print the latest commit as an object: `git cat-file -p HEAD`.
2. Note the `tree` line and the single `parent` line.
3. Do the same for the commit one step back. It is a merge; count its `parent` lines.
4. Answer the questions in the lesson panel.

## What just happened

`author` is who wrote the change; `committer` is who created this commit object. They differ when someone else applies, rebases or amends the work. The message is stored verbatim, which is why rewording a commit gives it a new id.
