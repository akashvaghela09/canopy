`git log` lists the commits, newest first. For each one you see its id (a long string of letters and digits), the author, the date and the message.

    git log

Outside Canopy, long output is shown one page at a time; press `q` to leave it.

## Try it

1. A change to `index.html` is already staged. Commit it with a message of your own.
2. Run `git log`. Your commit is at the top; three older ones by other people follow.
3. Answer the questions. For the commit question, copy the first few characters of the id from the log.

## What just happened

The log is the graph in text form: each entry is one dot. The ids are how you will point at specific commits later, and a few leading characters are usually enough.
