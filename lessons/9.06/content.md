A cherry-pick accepts a range, and applies the commits oldest first:

    git cherry-pick A..B      # everything after A, up to and including B
    git cherry-pick A^..B     # the same, plus A itself

`A..B` has the same meaning as in the log: commits reachable from B but not from A. That excludes A. To include A, start from its parent, `A^`.

## Try it

1. Branch `drafts` has five commits that `main` does not. List them, oldest at the bottom: two drafts and, between them, three finished posts.
2. On `main`, cherry-pick the three posts in one command. Leave both drafts behind.
3. Read the history of `main`: the three posts, in their original order, on top of the old tip.
4. Answer the question.

## What just happened

Each commit in the range became its own copy on `main`, so the graph shows three dotted arrows. The order matters: git applies the oldest first, which is why the range form is safer than typing ids by hand.
