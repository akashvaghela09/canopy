Customers were charged almost no tax for a few weeks. The constant `TAX_RATE` lives in `pricer/cart.py`, and someone changed its value. Try `-S TAX_RATE` first: it finds the commit that introduced the constant and one that referenced it, but not the one that changed its value. A value change keeps the count the same, so `-S` is blind to it.

`-G` looks at the diff lines themselves:

```
git log --oneline -G 'TAX_RATE ='
```

lists every commit where an added or removed line matches that regular expression. Changing `TAX_RATE = 0.20` to `TAX_RATE = 0.02` removes one matching line and adds another, so `-G` catches it. Use `-S` when you want "where did this appear or disappear"; use `-G` when you want "every commit that touched a line like this".

## Try it

1. Run `git log --oneline -S TAX_RATE` and note what it finds.
2. Run `git log --oneline -G 'TAX_RATE ='` and compare. One extra commit appears.
3. Open that commit and read the change to the tax rate.
4. Answer the questions in the lesson panel.

## What just happened

`-S` counts occurrences per file and reports changes in the count. `-G` runs a regex over each commit's added and removed lines. `-G` finds more, including pure rewrites of a line: try `-G TAX_RATE` without the ` =` and "Round totals to cents" appears too, because it rewrote the `return` line that uses the constant. `-G` is also slower, because it has to generate every diff.
