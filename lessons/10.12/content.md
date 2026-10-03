Five small repos, five accidents. Each folder has a `STORY.txt` describing what happened. Pick the tool that fits and put things right. One of the five cannot be fixed; recognise it instead of fighting it.

- `case1-reset/`: a hard reset dropped the last two commits on `main`.
- `case2-branch/`: `feature/invoices` was deleted with `-D`.
- `case3-rebase/`: `feature/pdf` was rebased onto the wrong branch and the rebase completed.
- `case4-stash/`: a stash with the retry logic was dropped.
- `case5-edit/`: an hour of edits to `report.py` was discarded with a restore before they were ever staged.

Decide for each: is the thing I lost a commit a reflog still knows about, an object only `fsck` can find, or something git never stored?

## Try it

Move into each folder, look (status, log, reflog, fsck), then act. Finish with the lost commits back on their branches and the stash content back (working tree or stash list) in case 4. For case 5, answer the question in the lesson panel.
