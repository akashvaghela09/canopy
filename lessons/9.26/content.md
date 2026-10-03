Sometimes you must rewrite a branch that is already on origin: your own review branch, after fixing a message or rebasing onto `main`. A normal push is rejected, because the new tip is not a descendant of the old one. `git push --force` would overwrite whatever is there, including a commit a teammate pushed a minute ago. Use the lease instead:

    git push --force-with-lease

It overwrites origin's branch only if it still points where your `origin/<branch>` says, that is, where it was when you last fetched. If someone pushed in between, the push is refused with "stale info" and nothing is lost.

One gap: a `git fetch` updates `origin/<branch>` and so renews the lease, even if you never looked at what arrived. `--force-if-includes` closes it: git also checks that your branch has, at some point, contained what you fetched (it looks in the branch's reflog). Commits that a fetch brought in but you never merged or rebased into your branch cannot be overwritten:

    git push --force-with-lease --force-if-includes

## Try it

1. You are on `login`, already pushed. Fix the typo in the last message ("logn"). Try a normal push and read the rejection, then push with the lease.
2. Press "Sam pushes a commit to login" in the lesson panel.
3. Push with the lease again, without fetching first. It is refused: the lease protected Sam's commit.
4. Fetch. Fast-forward your `login` to `origin/login` so it includes Sam's commit. Then rebase `login` onto `origin/main`, which has moved on by one commit.
5. Push with the lease (add `--force-if-includes` if you like; it passes because your `login` contained Sam's commit before the rebase). Origin's `login` now has your fixed commit, Sam's commit, and sits on the latest `main`.

## What just happened

The golden rule says not to rewrite shared commits, and this lesson is the one exception: a branch that is yours, where everyone knows it may be rewritten. Even then, the lease is what keeps a teammate's work safe, and `--force` alone has no place in a shared repository.
