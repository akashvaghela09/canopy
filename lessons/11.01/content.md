`pricer` is a small library that prices a shopping cart. Four people worked on it over six weeks. Somebody asks: "there used to be a `legacy_total` function, when did it come and go?" Reading thirty commits by hand is slow. Ask git to find commits by what changed in their diffs:

```
git log --oneline -S legacy_total
```

`-S<text>` (the "pickaxe") keeps only commits that changed how many times the text appears in a file: usually the commit that introduced it and the one that removed it, plus any commit that added or removed another use of it. Commits that only edit lines around it are skipped. Add `-p` to see the diffs, or `-- <path>` to look in one file only.

## Try it

1. Search the history for `legacy_total` and read the two commits it finds.
2. Run the search again with `-p` and confirm which commit adds the function and which one removes it.
3. Search for `apply_discount` the same way. It lists three commits: the oldest introduced the function, the others added uses of it.
4. Answer the questions in the lesson panel.

## What just happened

`-S` does not read commit messages; it diffs each commit and counts the text. That is why it finds additions and removals even when the message says nothing about them. If the text contains spaces, quote it: `-S 'legacy total'`.
