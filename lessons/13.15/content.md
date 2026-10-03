New machine, empty config. Set it up the way this section taught, then prove each piece works. The lesson folder has two repos, `work/app` and `personal/blog`, two identity files in `conf/`, and a bare monorepo `big.git`.

## Your tasks

- Commits under `work/` use `Alex Rivera <alex@acme.example>` and commits under `personal/` use `Alex <alex@home.example>`, through conditional includes of the files in `conf/`, not through local settings. Commit the waiting file in each repo to prove it.
- A global alias `lg` shows a decorated graph of all branches. Run it.
- `*.swp` files are ignored in every repository through a global ignore file, without adding a `.gitignore` anywhere.
- `work/app` has a `pre-commit` hook that refuses commits whose staged `.js` changes contain `FIXME`. Try to commit `src/notes.js` as it is and let the hook stop you; then remove the FIXME and commit.
- `work/app` normalizes line endings: a committed `.gitattributes` with `text=auto`, and `NOTES.txt` stored with LF endings.
- `big.git` is cloned into `mono` as a blobless partial clone with a sparse checkout of `api` only.
