Two todo commands fold a commit into the one above it:

- `squash` (or `s`) combines the changes and opens the editor with both messages, so you can write one good message.
- `fixup` (or `f`) combines the changes and throws this commit's message away, keeping the message above.

Several lines in a row can fold into the same commit. The messages matter: the clean history is for readers, so finish with subjects that say what each commit does.

## Try it

1. Read the history: five noisy commits on top of "Add app skeleton". They are really two pieces of work: the login form (first three) and the password reset (last two).
2. Start an interactive rebase over those five commits.
3. Fold "fix typo" and "wip" into "Add login form", and "oops forgot file" into "Add password reset". Use `squash` at least once so you see the message editor; when it opens, leave only the line `Add login form`. If the editor opens again for the reset group, leave only `Add password reset`.
4. Read the history: two commits, `Add login form` and `Add password reset`, each with the right files.

## What just happened

Five dots became two. Each kept commit holds the union of its group's changes, so the final files are identical to before; only the story changed. `fixup` is the quick choice when the extra commits have nothing worth keeping in their messages.
