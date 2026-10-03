The default log is long, and the one-line log hides dates and authors. `--pretty=format:` lets you build the view you need from placeholders:

| placeholder | meaning |
|---|---|
| `%h` / `%H` | short / full commit id |
| `%s` | subject line |
| `%an` / `%ae` | author name / email |
| `%ad` / `%ar` | author date / relative date |
| `%d` | branch and tag names (decorations) |
| `%C(yellow)...%C(reset)` | colours |

`--date=short|iso|relative` controls how `%ad` is written. `--format='...'` (or `--pretty=tformat:`) works like `--pretty=format:` but ends the output with a newline, which is tidier in a terminal. `--abbrev-commit` shortens ids in the built-in formats (`--pretty=medium`, `full`, `fuller`), and `--graph --decorate` adds the branch drawing and labels to any format.

## Try it

1. Build a one-line log that shows, in this order: short id, author date as `YYYY-MM-DD`, author name, decorations, subject. Use `--pretty=format:` with `%h`, `%ad`, `%an`, `%d` and `%s`, and `--date=short`.
2. Use it to answer the first two questions in the lesson panel.
3. Show the whole repository as a graph with decorations, so that the `seedlings` branch and the tag are visible.
4. Combine the format with a filter you already know: list only Priya's commits in your format.

## What just happened

A format string is a template applied to each commit. Once you have one you like, the next lesson turns it into an alias so it is one short word away.
