A lightweight tag is only a name. An **annotated tag** is a small object of its own, stored in the repo with a tagger, a date and a message, and it points at the commit. Use annotated tags for anything that matters, such as releases: they record who made the release and when, and they can be signed.

```
git tag -a <name> -m "<message>"
```

creates one. Leave out `-m` and the editor opens for the message, as with commits.

`git show` on an annotated tag prints the tag header (tagger, date, message) and then the commit. On a lightweight tag it prints only the commit. `git describe` uses annotated tags by default, which is why it failed in the last lesson.

## Try it

1. The repo already has a lightweight tag `v0.1` on an older commit. Show it and note where the output starts.
2. Create an annotated tag `v1.0` on the current commit with the message `Trail guide 1.0`.
3. Show `v1.0` and compare the start of the output with step 1.
4. Run `git describe` without options. It works now.
5. Answer the questions in the lesson panel.

## What just happened

Both tags appear in the same list and both name a commit. The difference is in what is stored: `v0.1` is a file holding a commit id; `v1.0` is a file holding the id of a tag object, which in turn holds the message and the commit id. In the graph, `v1.0` carries a dot: that marks an annotated tag. When in doubt, make tags annotated.
