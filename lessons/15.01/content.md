A **submodule** is a repository inside another repository. The outer project does not store the library's files; it stores a pointer to one exact commit of the library, plus the address to fetch it from. The pointer lives in the tree as a special entry (mode `160000`, a "gitlink"); the address lives in `.gitmodules`.

- `git submodule add <url> <path>`: clone the library to `<path>` and record both,
- `git submodule status`: show which commit each submodule is at,
- `.gitmodules`: a committed text file mapping paths to URLs.

## Try it

1. Add the library: `git submodule add ../lib.git lib`. The URL is relative to this project's origin, so it resolves to the `lib.git` repository next to it.
2. Read `.gitmodules`, then run `git submodule status`.
3. Look at the index entry: `git ls-files -s lib`. The mode is `160000` and the id is a commit, not a blob.
4. Check the status: two things are staged. Commit them.
5. Answer the questions in the lesson panel.

## What just happened

The project now says "at `lib/`, use commit d87eb66 of the repository at `../lib.git`". Anyone who clones the project gets that pointer and can fetch exactly that commit. The library's history stays in its own repository; `lib/.git` here is only a file pointing into `.git/modules/lib`.
