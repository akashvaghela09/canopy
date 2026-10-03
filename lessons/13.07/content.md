Hooks are scripts that git runs at certain moments. They live in `.git/hooks/`, named after the moment: `pre-commit` runs before a commit is created, `commit-msg` gets the message file and can reject it, `pre-push` runs before a push. A hook that exits with a non-zero status stops the operation. `.git/hooks` already contains `.sample` files you can read.

Hooks are not committed, because `.git` is not part of the repository. To share them, keep the scripts in a normal folder and point `core.hooksPath` at it.

## Try it

1. Create the file `.git/hooks/pre-commit` with this content and make it executable:

   ```
   #!/bin/sh
   if git diff --cached -- '*.js' | grep -q '^+.*FIXME'; then
     echo "pre-commit: staged .js changes contain FIXME" >&2
     exit 1
   fi
   ```

2. Add a line `// FIXME: handle missing notes file` to `src/app.js`, stage it, and try to commit. The hook refuses.
3. Sometimes you commit anyway, for example to save work on a branch nobody else sees. Commit the same change with `git commit --no-verify -m "..."`.
4. Share the hook: create a folder `hooks` in the project, move the script there, and run `git config core.hooksPath hooks`.
5. Remove the FIXME line from `src/app.js` and commit normally. Add the `hooks` folder to that commit so it travels with the project.

## What just happened

The hook ran as part of `git commit`, read the staged diff, and vetoed it. The hook only looks at `.js` files, so committing the script itself (which mentions FIXME) is allowed. `--no-verify` is the deliberate escape hatch; a hook is a guard rail, not a lock. With `core.hooksPath` the script is versioned like any other file, and every clone that sets the same config gets the same check.
