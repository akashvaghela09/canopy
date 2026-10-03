Blame tells you the last commit for each line. Sometimes you want the whole story of one function: every commit that changed it, in order, with the function as it looked each time. `git log` can follow a range of lines through history:

```
git log -L :total:pricer/cart.py
git log -L 6,12:pricer/cart.py
```

`-L :<name>:<file>` finds the first line that looks like a function header (by default, a line starting at the left margin) and matches the name, so `:total:` finds `def total(...)`; the block runs to the next such line. `-L <start>,<end>:<file>` follows a line range instead. Either way, git tracks the lines as they move and only shows commits that changed them. `--oneline` keeps the headers short; the diffs are always included.

## Try it

1. Run `git log -L :total:pricer/cart.py --oneline`. Count the commits and read what each did to `total`.
2. Try the same with a line range covering the function, for example `-L 6,12:pricer/cart.py`.
3. Compare with a plain path log of `pricer/cart.py`: it lists more commits, because they touched other parts of the file.
4. Answer the questions in the lesson panel.

## What just happened

`-L` is blame turned inside out: instead of one commit per line, you get every commit for a block of lines. It follows the block through edits in the same file; it does not follow the file across a rename.
