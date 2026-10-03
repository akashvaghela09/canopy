On a real project you rarely read the whole history. You ask a question: what did Sam do? What changed last week? Which commit mentioned the typo? `git log` has a filter for each.

- `--author=<name>` keeps commits by that person. Part of the name is enough: `--author=Sam`.
- `--since=<date>` and `--until=<date>` keep commits in a date range, for example `--since=2024-03-11 --until=2024-03-17`.
- `--grep=<text>` keeps commits whose message contains that text.

Filters combine with the options you already know, so you can get a short list.

## Try it

1. List the commits made by Sam Chen, one line each.
2. List the commits made between March 11 and March 17, 2024.
3. Find the commit whose message mentions a typo.
4. Answer the questions in the lesson panel.

## What just happened

Every filter narrows the same history. Nothing is removed from the repo; `git log` only prints the commits that match. If you combine two filters, a commit must match both.
