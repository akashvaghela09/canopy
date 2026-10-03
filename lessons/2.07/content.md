The status tells you *which* files changed. `git diff` shows *what* changed inside them, line by line. It compares your working tree with the staging area, so it shows the edits you have not staged yet.

    git diff
    git diff poem.txt

Reading it: a line starting with `-` is the old version, a line starting with `+` is the new one. A changed line appears as a `-` line followed by a `+` line. Lines without a sign are unchanged context, there to help you find your place.

## Try it

1. Check the status: two files are modified.
2. Run `git diff` and read the changes in both files.
3. Answer the questions.

## What just happened

Diff is how you review your own work before you save it.
