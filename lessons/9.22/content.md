A todo line can run a shell command instead of replaying a commit:

    exec ./test.sh

If the command fails, the rebase stops there, so you can fix things or look around. Typing an `exec` line after every pick by hand is tedious; `-x` does it for you:

    git rebase -i -x ./test.sh HEAD~5

This turns a rebase into a search: replay the history one commit at a time and run the tests after each, and the rebase stops at the first commit that breaks them.

## Try it

1. Read `test.sh`. It runs `greet.sh` and checks the output. Run it on the current commit: it fails.
2. Start an interactive rebase of the last five commits with the test as the command after every step. Read the todo list, then save it.
3. The replay stops at a failing step. Read the status and the newest commit: that commit introduced the bug. Answer the question.
4. You only wanted to find the culprit, so abort the rebase. `main` is where it was.

## What just happened

Because nothing in the list changed, git kept each original commit instead of copying it (its parent was the same), so the rebase stopped on the real commit, not a copy. With the culprit known, a reword, an edit or a drop in a second rebase would fix it. Section 11 teaches `git bisect`, which does the same search in fewer steps.
