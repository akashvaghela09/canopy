The last commit broke `settings.conf`: it cut the timeout to a value that is far too low, and it deleted the `retries` line. The version before that commit was right.

`restore` can take a file from any commit, not only from HEAD:

```
git restore --source=<commit> <file>
```

copies the file as it was in that commit into your working tree. The history is not changed. You then commit the restored file as a new commit, so the record shows what happened.

## Try it

1. Print `settings.conf` as it was one commit back, and compare with the file on disk.
2. Restore `settings.conf` from the commit before HEAD.
3. Check the status: the file shows as modified, because it now differs from HEAD.
4. Stage it and make a commit, for example "Restore retries setting".

## What just happened

The broken commit is still in the history, with a new commit on top that puts the file back. This is the safe way to undo a change to one file: nothing is rewritten, and anyone reading the log can see both the mistake and the fix.
