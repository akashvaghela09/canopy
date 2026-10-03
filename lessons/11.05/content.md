`tally.sh` adds up numbers. Release `v2.0` did it right; the current `main`, 56 commits later, gets `2 3 5` wrong. Somewhere in between one commit broke it. Testing 56 commits one by one is tedious; a binary search needs about six.

```
git bisect start
git bisect bad            # the current commit is broken
git bisect good v2.0      # this one was fine
```

Git checks out the commit halfway between them (HEAD is detached while bisecting). You test it and answer `git bisect good` or `git bisect bad`; git halves the range and checks out the next middle commit. When one commit is left it prints "is the first bad commit". Finish with

```
git bisect reset
```

which returns you to where you started. The repo has a test for this: `bash tests/sum.sh` exits 0 when the sum is right and 1 when it is wrong.

## Try it

1. Confirm the bug: `bash tally.sh 2 3 5` prints 5 instead of 10. Check out nothing yet.
2. Start a bisect, mark HEAD bad and `v2.0` good.
3. At each step run `bash tests/sum.sh && echo good || echo bad` and report the result to git. Watch the graph: it marks the commits you call good and bad, and the search window is everything between them. HEAD's ring shows the commit under test.
4. When git names the first bad commit, read its message and note its id.
5. Reset the bisect and check you are back on `main`.
6. Answer the questions in the lesson panel.

## What just happened

Each answer halves the candidates: 56 commits need six tests. Git picks the commit that splits the remaining range most evenly, so the order it visits is not left to right. The only requirement is that you can tell good from bad at any commit.
