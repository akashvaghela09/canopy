This repo has two **tags**, `v0.1` and `v1.0`. A tag is a fixed name for one commit, usually a release. You will create tags in section 5; here you only read them.

`git describe` names a commit by the nearest tag behind it:

```
git describe
```

prints something like `v1.0-3-g9536875`. Read it as three parts:

- `v1.0`: the nearest tag reachable from the commit,
- `3`: how many commits the commit is ahead of that tag,
- `g9536875`: the letter `g` (for git) followed by the short id of the commit itself.

If the commit *is* the tagged commit, the output is only the tag name. That is why build tools use `git describe` for version strings: a clean release prints `v1.0`, anything after it prints `v1.0-3-g...`.

## Try it

1. Run `git describe` and compare its parts with the graph.
2. Run `git describe v1.0`. The commit is exactly on the tag.
3. Run `git describe HEAD~1` and watch the number change.
4. Answer the questions in the lesson panel.

## What just happened

`git describe` walks back from the commit, counting, until it reaches an annotated tag. The short id makes the name unique: two different commits never get the same description.
