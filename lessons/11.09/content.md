Who worked on this project, and who has been active lately? `git log --author` answers one person at a time. `shortlog` groups the whole log by author:

```
git shortlog -sn
git shortlog -sne
git shortlog -sn --since=2024-03-10
```

`-s` shows only counts, `-n` sorts by count instead of name, `-e` adds email addresses (useful when one person committed under two names). Everything `git log` accepts for filtering works here too: `--since`, `--until`, `--author`, a path, a range such as `v1.0..v1.1`. With no revision it reads `HEAD`, here `main`. (In scripts, give a revision such as `HEAD`: with no terminal attached, `shortlog` reads log text from standard input instead.)

## Try it

1. Run `git shortlog -sn` and read the ranking. Note that the merge commit counts for its author like any other commit.
2. Add `-e` and look at the addresses.
3. Limit it to commits since 2024-03-10. Who leads that period?
4. Try a range: `git shortlog -sn v1.0..v1.1` shows who worked on the 1.1 release.
5. Answer the questions in the lesson panel.

## What just happened

`shortlog` was written for release notes (`git shortlog v1.0..v1.1` without `-s` prints each author's commit subjects), and the count mode fell out of it. It is a quick way to find who to ask about a part of the project: add a path to see who touched it most.
