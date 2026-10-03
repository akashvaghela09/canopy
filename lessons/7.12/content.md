A plain `git pull` can create a merge commit without you noticing, which some teams do not want on `main`. The safe form only moves your branch forward and refuses to do anything else:

```
git pull --ff-only
```

If a fast-forward is possible, it happens. If not, git fetches but stops with `Not possible to fast-forward`, your branch stays as it was, and you decide what to do next with full information. To make this the default for a repository:

```
git config pull.ff only
```

This clone has `pull.rebase false` set, so a plain `git pull` here would merge silently. That is exactly the surprise `--ff-only` prevents.

## Try it

1. Sam already pushed a new trail. Run `git pull --ff-only`. It fast-forwards; check the graph.
2. Add a line to `README.md` and commit it.
3. Press **Teammate pushes a fix**, then run `git pull --ff-only` again. (If you pressed the button earlier already, press it once more first: Sam has one more change.) Read the refusal. Answer the question.
4. Decide. List what is incoming (`main..origin/main`), then merge `origin/main` into `main` yourself. Draw the graph.

## What just happened

The second pull refused because joining the two histories needed a merge commit, and `--ff-only` never makes one on its own. Nothing was lost: the fetch half ran, `origin/main` moved, and you then merged deliberately. The merge commit in your graph is one you chose, not one that appeared by accident.
