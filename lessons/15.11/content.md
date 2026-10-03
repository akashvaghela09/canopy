A **note** is text attached to a commit from the outside. The commit object is untouched, so its id stays the same; the note is stored in a separate ref, `refs/notes/commits`, as a tree that maps commit ids to text. `git log` shows notes under the message.

- `git notes add -m "<text>" <commit>`: attach a note,
- `git notes show <commit>`, `git notes append -m "<text>" <commit>`, `git notes list`,
- notes are not pushed by default: `git push origin refs/notes/commits` publishes them.

## Try it

1. Find the commit that added the login page (one step behind the tip). Attach the note `Reviewed: looks good` to it.
2. Show the note, then append a second line: `Approved for release`.
3. Read the log: the note appears under that commit, and the commit ids are the same as before.
4. `git notes list` shows the mapping: note blob id, then commit id.
5. Publish the notes: `git push origin refs/notes/commits`. Look at `origin` in the graph.

## What just happened

Notes let you record review results, build ids or ticket links after the fact, without rewriting anything. Because they are a separate ref, teammates fetch them explicitly too: `git fetch origin 'refs/notes/*:refs/notes/*'`.
