`HEAD~3` counts commits back along the history. The reflog needs a different address, because it counts *moves*, and a move can jump anywhere. That address is `@{n}`:

```
git show main@{3}        # where main pointed three moves ago
git show HEAD@{1}        # where HEAD was one move ago
```

The number is a position in that ref's reflog, not a number of commits. `main@{3}` and `HEAD@{3}` can be different commits, because HEAD's reflog also records every branch switch.

The braces also take a moment in time:

```
git show 'main@{2024-03-10}'
git show 'main@{2024-03-13T12:00}'
```

gives you the commit `main` pointed to at that moment. Git reads the date in your local time zone and picks the newest reflog entry that was already written then. Forms like `@{yesterday}` or `@{2.hours.ago}` work the same way, counted back from your computer's clock right now. The reflog entries in this practice repo were written in March 2024, so relative forms like these all land on the current tip here; use an explicit date instead.

## Try it

1. Print the reflog of `main` and read the dates on the entries. One of them is a reset.
2. Open `main@{3}` and note which commit it is.
3. Open `main` as it was on 2024-03-10, then as it was at midday on 2024-03-13.
4. Print the reflog of HEAD and compare the numbering with `main`'s.
5. Answer the questions in the lesson panel.

## What just happened

`~` walks parents; `@{}` walks your own footsteps. Date forms are handy after a bad morning: `main@{yesterday}` is where main pointed 24 hours ago.
