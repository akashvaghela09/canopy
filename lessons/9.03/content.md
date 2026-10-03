An amend commits whatever is staged, together with everything the old commit already had. That makes it the way to add a forgotten file or a last fix to the newest commit. `--no-edit` keeps the message as it is:

    git commit --amend --no-edit

Two options you will meet in the manual: `--reset-author` stamps the new commit with you as the author and the current time (useful when you amend someone else's unpublished commit), and `--date="..."` sets the author date by hand.

## Try it

1. Check the status. The last commit added `contact.html`, but `contact.css` was never staged.
2. Stage `contact.css`.
3. Amend the last commit without changing its message.
4. Look at the last commit's file list in the history: it now contains both files, and the message still reads "Add contact page".

## What just happened

As in the previous lesson, the old commit was replaced and ghosted. This time the snapshot changed too: the new commit holds `contact.html` and `contact.css`. The number of commits on `main` stayed the same.
