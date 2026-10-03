`fmt.sh` turns cents into a price: `bash fmt.sh 1205` should print `12.05`. On `main` it prints `12.5`; at `v2.0` it was right. This time, let git do the testing.

`git bisect run <command>` runs your command at every step and reads its exit code: 0 means good, 1 to 127 means bad, with one exception: **125** means "cannot test this commit, skip it" (the same as typing `git bisect skip`). Anything else, including a crash with 128 or higher, aborts the bisect.

```
git bisect start HEAD v2.0
git bisect run bash check-fmt.sh
git bisect reset
```

`bisect start <bad> <good>` is a shortcut for the three commands from the last lesson. The script can be anything that exits the right way; keep it outside the files git checks out, or at least untracked, so it stays the same at every commit.

## Try it

1. Write a tiny script `check-fmt.sh` that exits 0 when `bash fmt.sh 1205` prints `12.05` and 1 otherwise. Run it once by hand to check its exit code.
2. Start a bisect with HEAD bad and `v2.0` good, then hand your script to `git bisect run`.
3. Read the result: the first bad commit and its message.
4. Reset the bisect.
5. Answer the questions in the lesson panel.

## What just happened

The search is the same as before; only the "run the test and type the verdict" loop moved into git. With a real test suite (`git bisect run make test`) a regression hunt over hundreds of commits takes a minute of your time.
