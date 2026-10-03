Git's ids are SHA-1 hashes. SHA-1 is no longer considered collision-resistant, so git does two things about it. Since 2017 it uses a **hardened SHA-1** that detects the known collision attack and refuses such objects. And since version 2.29 a repository can use **SHA-256** instead (marked experimental until git 2.42): 64-character ids, same object model.

The catch is interoperability. A SHA-256 repository cannot push to or fetch from a SHA-1 one; moving history across means re-importing it. Hosting services have been slow to accept SHA-256 repositories, so SHA-1 remains the default.

## Try it

1. In the lesson folder (not inside `garden`), create a SHA-256 repository: `git init --object-format=sha256 sha-repo`.
2. Inside it, create `README.md` containing `hello`, and make a commit.
3. Look at the commit id and count its characters.
4. Hash the text `hello` in both repositories: `echo hello | git hash-object --stdin` in `sha-repo` and again in `garden`.
5. `git config extensions.objectformat` inside `sha-repo`. The same key is absent in `garden`.
6. Answer the questions in the lesson panel.

## What just happened

The object model is the same; only the hash function differs, so ids are longer everywhere, including the ids stored inside trees, commits and tags. The same content gets a different, longer name. `extensions.objectformat` in `.git/config` is how git knows which one a repository uses.
