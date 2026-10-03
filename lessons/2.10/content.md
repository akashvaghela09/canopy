Some files should never be committed: build output, logs, caches, passwords. Listing them in a file called `.gitignore` makes git stop mentioning them. Ignored files stay on disk; they are hidden from the status and skipped when you stage everything.

One pattern per line:

    build/
    *.log
    !audit.log

`build/` ignores that folder (the slash means "a folder"). `*.log` ignores every file ending in `.log`. `!audit.log` makes an exception: the `!` undoes an earlier pattern for that name.

`.gitignore` is a normal file in your repo. Commit it, so everyone working on the project shares the same rules.

## Try it

1. Check the status: a `build` folder, three log files and `notes.txt` are untracked.
2. Create `.gitignore` with the three patterns above, one per line. The editor in the files panel works well for this. (In the terminal, `>>` adds a line to the end of a file, and the `!` line needs single quotes: `echo '!audit.log' >> .gitignore`.) The team keeps `audit.log` in the repo; everything else in that list is noise.
3. Check the status again: only `.gitignore`, `audit.log` and `notes.txt` are left.
4. Stage everything and commit.
5. Answer the question.

## What just happened

Ignoring is a filter on *untracked* files. A file git already tracks is never affected by `.gitignore`. To stop tracking one, you remove it from git, which is the next lesson.
