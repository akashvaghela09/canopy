This lesson removes two branch labels; one of them points at a commit no other branch reaches, which then becomes hard to find.

Deleting a branch deletes a **label**. The commits stay in the repo exactly as they were. If another branch can still reach them, nothing changes for anyone. If no branch can reach them, the graph draws them gray: nothing points at them any more, but they still exist, and section 10 shows how to get such commits back.

```
git branch -d <name>
```

deletes a branch that is merged into the current branch. For an unmerged branch git refuses with "not fully merged".

```
git branch -D <name>
```

deletes it anyway. Use it when you are sure the work on that branch is not wanted.

You cannot delete the branch you are on.

## Try it

1. List the merged and the unmerged branches.
2. The `pests` branch has been merged, so its label is clutter. Delete it with `-d`.
3. `experiment` holds one commit nobody wants. Try `-d` and read the refusal.
4. Delete `experiment` with `-D`. Note the commit id in git's message, and show that commit: it still exists.
5. Leave `herbs`; it is unmerged work that is still wanted.
6. Answer the question in the lesson panel.

## What just happened

Two flags vanished from the graph. The commit from `experiment` turned gray: no label reaches it any more, and `git log --all` no longer lists it, but the commit object is still in the repo. Deleting a branch does not delete commits; it only removes one of the names you had for finding them. The commits stay until git's automatic cleanup removes ones that have been unreachable for a long time (section 10 covers this).
