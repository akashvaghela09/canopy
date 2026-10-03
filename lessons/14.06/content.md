There are two kinds of tag and they are stored differently.

A **lightweight** tag is only a ref: a file in `.git/refs/tags/` holding a commit id. There is no object for it.

An **annotated** tag is a ref *plus* a tag object. The object records which object is tagged, the tagger, a date and a message, and it is signed if you asked for that. The ref file holds the id of the tag object, not of the commit.

## Try it

1. `v0.1` is lightweight and `v1.0` is annotated. Ask `cat-file` for the type of each name.
2. Print the tag object: `git cat-file -p v1.0`. Read its `object`, `type`, `tag` and `tagger` lines.
3. Print both ref files under `.git/refs/tags/` and compare them with the ids you saw.
4. Answer the questions in the lesson panel.

## What just happened

`v0.1` resolves straight to a commit. `v1.0` resolves to a tag object, which in turn names the commit. Git follows that extra step for you in most commands; `v1.0^{}` asks for the commit directly.
