When you pull or push without naming a remote and branch, git needs to know which remote branch your branch belongs with. That link is the branch's **upstream**. A clone sets it for `main` automatically: `main` tracks `origin/main`. A branch you create from a local branch has no upstream until you set one. (Starting a branch from `origin/<name>` is different; see 7.11.)

```
git branch -vv                              each branch, its upstream, and ahead/behind counts
git status -sb                              the same counts on the first line
git branch --set-upstream-to=origin/<name>  set the upstream of the current branch
git log @{u}..                              your commits that the upstream does not have
```

`@{u}` (or `@{upstream}`) is a short name for "the upstream of the current branch". **Ahead** counts your commits the upstream lacks; **behind** counts the upstream's commits you lack.

## Try it

1. Run `git branch -vv`. Read the line for `main`: it names `origin/main` and shows how far apart they are. Answer the first two questions.
2. Run `git status -sb` and find the same numbers.
3. Run `git log --oneline @{u}..` and check that it lists exactly the "ahead" commits.
4. The branch `signage` was created from `origin/signage` with tracking turned off. Switch to it, look at `git branch -vv`: no upstream. Set it with `git branch --set-upstream-to=origin/signage`.
5. Check `git branch -vv` once more.

## What just happened

The counts in `branch -vv` and `status -sb` only exist because of the upstream link; without it git has nothing to compare against. Setting the upstream for `signage` means that from now on plain `git pull` and `git push` on that branch know where to go.
