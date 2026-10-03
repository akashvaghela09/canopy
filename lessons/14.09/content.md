A branch is a file holding a commit id. Creating, moving and deleting branches is therefore writing, rewriting and removing small files, and git has plumbing for exactly that, with locking so nothing is half-written.

- `git show-ref` and `git for-each-ref`: list refs with their ids,
- `git symbolic-ref HEAD`: which ref HEAD points to,
- `git update-ref <ref> <commit>`: create or move a ref,
- `git update-ref -d <ref>`: delete it,
- `git pack-refs --all`: move loose ref files into one `packed-refs` file.

## Try it

1. List the refs with `git show-ref`, then with `git for-each-ref`. Print what HEAD names with `git symbolic-ref HEAD`.
2. Create a branch with plumbing only: `git update-ref refs/heads/experiment HEAD~2`. Check the files panel or `.git/refs/heads/`.
3. Move it: `git update-ref refs/heads/experiment herbs`.
4. Delete the stale branch: `git update-ref -d refs/heads/old-idea`.
5. Pack the refs with `git pack-refs --all` and look at `.git/packed-refs` and at `.git/refs/heads/` afterwards.
6. Answer the question in the lesson panel.

## What just happened

Every branch command you know ends in one of these writes. `packed-refs` is where git keeps refs it has consolidated; a ref can live loose, packed, or both, and the loose file wins.
