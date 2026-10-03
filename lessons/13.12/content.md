A normal clone downloads the whole history, but it does not have to put every file in the working tree. Sparse checkout limits the working tree to the folders you choose. In a large monorepo that means fewer files to index, search and build, while commits, branches and history stay complete.

Cone mode is the simple form: you list folders, and git checks out those folders plus every file in the repository root.

- `git sparse-checkout init --cone` turns sparse checkout on in cone mode (newer git defaults to cone, and `set` alone is enough there).
- `git sparse-checkout set <dir>...` chooses the folders. Running `set` again replaces the list.
- `git sparse-checkout list` shows the current list; `git sparse-checkout disable` brings every file back.

## Try it

`big.git` holds four parts of one product: `web/`, `api/`, `mobile/` and `docs/`. You only work on the API.

1. Clone `big.git` into a folder named `mono` and go inside.
2. Turn on sparse checkout in cone mode and choose `api`. List the files: only `api/` and the root `README.md` remain.
3. Show the current selection with `git sparse-checkout list`.
4. Switch to the branch `feature/api-v2`. The selection stays and `api/v2.md` appears.
5. You also need the documentation: set the selection to `api` and `docs`.

## What just happened

The other folders are still in the repository; `git log -- web/` proves it. Sparse checkout only changes which paths are materialised on disk, recorded in `.git/info/sparse-checkout`. Combine it with a partial clone (two lessons from now) and even the file contents of the other folders stay on the server.
