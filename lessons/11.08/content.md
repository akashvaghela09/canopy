Priya's rounding work exists twice: `topic/rounding-v1` as she first wrote it on top of `v1.0`, and `topic/rounding` after she rebased it onto today's `main` and reworked it. A normal diff between the two tips mixes in everything `main` gained in between. What you want is commit against commit: did each change survive the rebase intact?

```
git range-diff v1.0..topic/rounding-v1 main..topic/rounding
```

takes two ranges and pairs up matching commits. Each pair gets a marker: `=` the patch is identical, `!` the patch changed (a diff of the two patches follows: the first `+`/`-` says whether the line is new or gone in the second version, the second is the patch's own `+`/`-`; so `++` is a line the new version adds that the old one did not), `<` the commit exists only in the first range, `>` only in the second.

## Try it

1. List each series on its own: `v1.0..topic/rounding-v1` has three commits, `main..topic/rounding` has two.
2. Run `range-diff` on the two ranges and read the three result lines.
3. For the pair marked `!`, read the inner diff and find what was added.
4. Answer the questions in the lesson panel.

## What just happened

`range-diff` compares patches, not snapshots, so a rebase onto a new base shows as `=` as long as the change and its surrounding lines are the same. Reviewers use it to check a re-pushed branch: "what did you change since the last version?"
