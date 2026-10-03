A **tag** is a name for one commit that does not move on its own. Branch labels advance with every commit; a tag stays where you put it. That is what you want for a release: `v1.0` should mean the same commit next year.

```
git tag <name>
```

tags the commit HEAD is on.

```
git tag <name> <commit>
```

tags an older commit. `git tag` alone lists all tags, and `git tag -l '<pattern>'` filters them, for example `git tag -l 'v*'`. A tag name works anywhere a commit name does: you can show it, diff against it or start a branch from it.

This kind of tag is called **lightweight**: a name and nothing else. The next lesson adds the other kind.

## Try it

1. Tag the current commit `v0.2`.
2. Tag the commit "Add ridge trail", two commits below HEAD, as `v0.1`.
3. List all tags, then list only the tags that start with `v`.
4. Show the commit behind `v0.1`.
5. Describe HEAD by its nearest tag. It fails: by default describe only looks at annotated tags, the kind you make in the next lesson. Add `--tags` to include lightweight ones.
6. Answer the questions in the lesson panel.

## What just happened

Tags are drawn in the graph with a different shape from branch flags, because they behave differently: making a commit now would move `main`, but `v0.2` would stay on the commit it names. Like branches, tags are tiny files, in `.git/refs/tags`.
