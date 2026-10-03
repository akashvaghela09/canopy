Once a merge has been shared, you should not reset it away; other people already have it. The tool for shared history is a revert, and a merge commit needs one extra piece of information.

A merge has two parents, so "undo this commit" is ambiguous: undo back to which side? You say which parent is the **mainline**, the side to keep:

```
git revert -m 1 <merge-commit>
```

Parent 1 is the branch you merged into (`main`), so `-m 1` removes what the other branch brought in. The result is a normal commit that undoes the merge's changes. The merge commit itself stays in history.

That leads to a trap. The branch's commits are now **ancestors** of `main`, so git counts them as merged. Merge the branch again and git brings in only commits made since, if any; with nothing new it says "Already up to date". The changes your revert removed stay removed. If the branch got fixes and you merge them, they land on top of code that is not there, often as conflicts. To bring the work back, **revert the revert** first, which re-applies the changes, and only then merge whatever is new.

## Try it

1. List the merge commits and find the one that merged `promo`. It is not the newest commit.
2. Revert it with `-m 1`. Keep the prepared message. Check that `promo.html` is gone.
3. Merge `promo` again and read what git says. Nothing changed.
4. Revert the revert commit. `promo.html` is back. Recent git versions title this commit `Reapply "..."`; older ones write `Revert "Revert ..."`.

## What just happened

History now tells the whole story in three commits: the merge, its revert, and the revert of the revert. Nothing was rewritten, so everyone who had the merge can take these commits as normal updates. Undoing a shared merge costs a bit of history noise; that is the price of not rewriting.
