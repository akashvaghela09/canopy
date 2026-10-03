The tax-rate bug was fixed in the commit "Fix tax rate". Support wants to know which releases have the fix and which branches still need it. Instead of reading logs, ask about containment:

```
git tag --contains <id>
git branch --contains <id>
git merge-base --is-ancestor <id> v1.0 ; echo $?
git name-rev <id>
```

`--contains` lists every tag or branch whose history includes the commit. `merge-base --is-ancestor A B` is the same question for one pair, answered by the exit code (0 yes, 1 no), which is handy in scripts. `name-rev` goes the other way: it names a commit relative to the nearest ref, such as `tags/v3.2~4`, four commits before tag `v3.2`.

## Try it

1. Find the id of "Fix tax rate".
2. List the tags that contain it, then the branches.
3. Check with `merge-base --is-ancestor` whether `v1.0` has the fix.
4. Run `name-rev` on the fix and read the name git gives it.
5. Answer the questions in the lesson panel.

## What just happened

"Contains" is reachability: a ref contains a commit when you can walk from the ref back to it through parents. A branch rebased onto a newer `main` picks the fix up; a branch that still starts from an older release does not, however recent its own commits are.
