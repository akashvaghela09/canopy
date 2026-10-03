A good commit does one thing, and its subject says what. "Add config module" can be reviewed, reverted or cherry-picked on its own. "stuff" cannot. Commits like that are cheap to write and expensive for everyone who reads the history later, including you.

The convention most projects use for the subject line:

- imperative mood, as if giving an order: "Add", "Fix", "Remove", not "Added" or "Fixes";
- capital first letter, no full stop, 50 characters or fewer;
- a blank line, then an optional body that explains why.

You rarely write commits perfectly the first time. The fix is a short cleanup pass before publishing: split commits that do two things, fold fixes into the commit they fix, and reword the rest.

## Try it

The branch `cleanup` has three commits: "stuff", "more" and "fix". Read them first. "stuff" does two unrelated things, "more" adds tests, and "fix" corrects a bug that "stuff" introduced.

Rewrite the branch so it has exactly three commits, each with one purpose and a conventional subject:

1. A commit that only changes `README.md` (the usage section).
2. A commit that only adds `src/config.js`, with the default limit already at 100, so the bug never exists in history.
3. A commit that only adds `test/config.test.js`.

Keep the commits in an order that makes sense. Suggested subjects: "Document usage in README", "Add config module", "Add config tests".

## What just happened

`git log --oneline main..cleanup` now reads like a short story. Anyone can tell what each commit is for without opening it, and "fix" is gone because the bug it fixed is gone too.
