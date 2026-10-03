A project's `.gitignore` is for things the project produces: build output, dependencies, logs. It is committed and shared. Files that only your machine produces, such as editor swap files and IDE folders, do not belong there; they would have to be listed in every project you touch.

Git has two other places for ignore patterns:

- **A global ignore file.** Any file you like, named in the global setting `core.excludesFile`. Its patterns apply in every repository you use. Put your editor and OS noise here, once. If `core.excludesFile` is not set, git falls back to `$XDG_CONFIG_HOME/git/ignore` (on most machines `~/.config/git/ignore`). In Canopy, the global config and that folder both belong to this lesson, so "every repository" means every repository in this lesson.
- **`.git/info/exclude`** inside one repository. It works like `.gitignore` for that repo only, and it is never committed. Use it for files that are personal to you and this project, without touching the shared `.gitignore`.

## Try it

Both repos here, `app` and `docs`, show editor noise in their status: a `.swp` file and an `.idea/` folder. Each also has a `scratch.md`.

1. Create a file `ignore-everywhere` in this lesson folder containing the patterns `*.swp` and `.idea/`.
2. Set `core.excludesFile` in the global config to the full path of that file. `pwd` prints the path of the current folder.
3. Check the status of both repos. The editor files should be gone from both, without any `.gitignore` being added or changed.
4. In `app` only, hide `scratch.md` through `.git/info/exclude`. In `docs`, `scratch.md` is a real draft and must stay visible.

## What just happened

Three layers of ignore rules now apply, from widest to narrowest: your global file, the repo's `.git/info/exclude`, and the project's committed `.gitignore`. `git status --ignored` shows which files are being hidden, and `git check-ignore -v <file>` names the rule responsible.
