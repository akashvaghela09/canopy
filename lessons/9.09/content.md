When `main` moves on while you work on a branch, you can merge `main` in (a merge commit) or **rebase**: take your branch's commits off their old base and replay them on top of the new one.

    git rebase <base>

Git finds the commits on your branch that `<base>` does not have (skipping any whose change `<base>` already contains), then cherry-picks them one by one onto `<base>` and moves your branch label to the last copy. The result is a straight line, as if you had started your work from the new tip. The originals are left behind, ghosted.

The golden rule applies with full force: rebase only commits that nobody else has yet.

## Try it

1. You are on `search`. List the commits that `search` has and `main` does not: three of them. Draw the graph: `main` has moved on by two commits since the branch started.
2. Rebase `search` onto `main`.
3. Draw the graph again. The three commits now sit on top of `main`'s tip, with new ids, and there is no merge commit.
4. Answer the question.

## What just happened

Watch the graph: the three old commits fade while their copies slide onto the new base. `main` itself did not move. A merge would have kept the fork visible and added a commit with two parents; the rebase left one line.
