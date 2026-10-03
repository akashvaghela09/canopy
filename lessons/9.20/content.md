A commit that does two things is split in three moves, all of them known to you:

1. Stop the rebase at the commit with `edit`.
2. Undo the commit while keeping its changes in the working tree: a mixed reset to its parent (`HEAD^`).
3. Stage and commit the pieces one by one, using patch mode where both pieces live in the same file. Then continue the rebase.

The commits after it are replayed on top of the new pair.

## Try it

1. Read the history. "Add search box and fix footer year" changed `index.html` in two unrelated places. "Add about page" comes after it.
2. Start an interactive rebase over the last two commits and stop at the big one.
3. Reset it away, keeping the changes. Check the status: `index.html` is modified, nothing is staged.
4. Stage only the search-box hunk and commit it as `Add search box`.
5. Stage the remaining change and commit it as `Fix footer year`.
6. Continue the rebase. Read the history: the big commit became two, and "Add about page" sits on top.

## What just happened

One dot became two. Between them, the union of their changes equals the original commit, so the final files are unchanged. A reviewer now sees a feature and a fix as separate commits.
