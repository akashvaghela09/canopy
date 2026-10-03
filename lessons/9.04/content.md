Sometimes you want one commit from another branch, not the whole branch. `git cherry-pick` takes the change a commit made and applies it on top of your current branch as a new commit:

    git cherry-pick <commit>

The copy has the same message and author, and makes the same change, but it has a different parent, so it is a different commit with a new id. The original stays where it is.

## Try it

1. You are on `checkout`, which has three commits that `main` does not. Read its history and find "Fix price rounding in cart". Look at that commit to see what it changes.
2. Switch to `main`.
3. Cherry-pick the fix onto `main`.
4. Read the history of `main`: the fix is now its newest commit. Compare its id with the original on `checkout`.
5. Answer the question.

## What just happened

The graph draws a dotted arrow from the original to the copy. `checkout` did not change; `main` gained one commit. The two commits are related by content, not by id, and git itself keeps no link between them unless you ask for one (next lesson).
