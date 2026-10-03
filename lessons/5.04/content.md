Most of the time you create a branch because you want to work on it right away. One command does both:

```
git switch -c <name>
```

creates `<name>` at the current commit and switches to it. `-c` is short for `--create`.

```
git switch -c <name> <start>
```

does the same but starts the branch at another commit.

## Try it

1. Create a branch `maps` at the current commit and switch to it in one step. Confirm with the status that you are on `maps`.
2. Now start a branch `archive/first-trails` at the commit "Add ridge trail", two commits below the tip of `main`, and switch to it in the same command.
3. Look at the files panel, or run `ls`: `gear.md` is gone, because that commit did not have it yet.
4. Draw the graph and find all three labels.

## What just happened

`switch -c` is `branch` followed by `switch`. In the graph, a new flag appeared and HEAD jumped onto it immediately. Starting from an older commit is how you begin work that should not include the newest changes.
