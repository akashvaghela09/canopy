When both branches have moved on since they split, a fast-forward is impossible. Git then does a **three-way merge**. It looks at three commits: the tip of your branch, the tip of the other branch, and the **merge base**, the newest commit the two have in common. Changes made on each side since the base are combined, and the result is saved as a new **merge commit**.

A merge commit is special in one way: it has two parents.

- `HEAD^1` is the first parent: the commit your branch was on before the merge.
- `HEAD^2` is the second parent: the tip of the branch you merged in.

`HEAD^` alone means `HEAD^1`, which is why the shortcuts you know keep working after a merge.

## Try it

1. Draw the history. `main` and `opening-hours` have both moved since they forked.
2. On `main`, run `git merge opening-hours`. The editor opens with a prepared message; save it.
3. Draw the history again. The new commit has two incoming lines.
4. Look at `HEAD^1`, `HEAD^2` and the merge base, then answer the questions.

## What just happened

The merge commit joins the two lanes. Its first parent is the old tip of `main`, its second parent is the tip of `opening-hours`. The merge base stays where it was; git only used it to work out what each side changed.
