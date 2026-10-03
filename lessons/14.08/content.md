Many git commands accept names: `HEAD`, `main`, `v1.0`, `HEAD~2`, `wip^`. `git rev-parse` is the command that turns a name into the id it stands for. It also answers questions about where you are in the repository.

- `git rev-parse <name>`: the full id,
- `git rev-parse --abbrev-ref HEAD`: the current branch name,
- `git rev-parse --show-toplevel`: the absolute path of the repository root,
- `git rev-parse --show-prefix`: the path from the root to your current folder,
- `git rev-parse --git-dir`: where the `.git` folder is.

## Try it

1. Resolve a few names: `HEAD`, `main`, `herbs`, `wip~1`, `v1.0^{}`. Which two are the same commit?
2. Ask for the current branch name with `--abbrev-ref HEAD`.
3. Ask for `--git-dir` from the repository root.
4. Change into `docs/` and ask for `--show-toplevel` and `--show-prefix`. Come back to the root.
5. Answer the questions in the lesson panel.

## What just happened

Scripts and aliases use `rev-parse` so they never guess. "Which branch am I on", "where is the root", "what id is this": one command, exact answers.
