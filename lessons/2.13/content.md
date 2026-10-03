The long status is friendly but slow to read. The short form prints one line per file:

    git status -s
    git status -sb

`-b` adds a first line with the branch name. Each file line starts with two columns. The **left** column is the staging area and the **right** column is the working tree. `M` means modified, `A` added, `D` deleted, `?` untracked. A space means "no change here". So:

     M notes.txt    changed, not staged
    M  notes.txt    changed and staged
    MM notes.txt    staged, then changed again
    A  todo.txt     new file, staged
     D old.txt      deleted, not staged
    ?? draft.txt    untracked

## Try it

1. Run the short status and read every line. Answer the questions.
2. Change the repo so the short status shows exactly this:

        M  a.txt
        A  b.txt
        M  c.txt
        D  e.txt
        ?? d.txt

   Do not commit, and do not create or delete anything on disk.

## What just happened

You can now read a status at a glance. The two columns are the three-area strip in two characters: left for staging, right for the working tree.
