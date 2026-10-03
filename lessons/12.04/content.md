Before you ask anyone to look at a branch, look at it the way they will. Reviewers do not read your editor; they read the commits and the total diff. Three views cover it:

- `git log -p main..` shows each commit on the branch with its patch. Read it commit by commit.
- `git diff --stat main...` lists every file the branch touches, with how much changed. Anything surprising in that list is a problem.
- `git diff main...` is the whole change as one patch, the view a review page shows.

After you fix what you found, `git range-diff main <old-tip> <new-tip>` compares the branch before and after. It pairs up old and new commits and shows what changed inside each one, which is how a reviewer confirms a second round only touched what was asked.

## Try it

Your branch `feature/reminders` is finished and pushed as a backup. Review it before announcing it.

1. Read the branch commit by commit, then the file list. Answer the question in the lesson panel about the file count.
2. Two things should not be in the branch: a debug print in `src/reminders.js`, and a scratch file that was committed by accident. Find both.
3. Fix both. Add new commits, amend, or rewrite the branch; any clean result is fine. Make sure the reminders feature itself stays.
4. Compare the branch with its pushed copy using `git range-diff main origin/feature/reminders feature/reminders`.

## What just happened

The range-diff shows which commits are unchanged, which changed and what was added or dropped. That is the summary you send with "updated as requested". Pushing the new branch is the next step; this lesson stops at the review.
