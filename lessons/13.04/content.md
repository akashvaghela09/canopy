An alias gives a long command a short name. It is a config entry under `alias.`, so it lives at whatever level you set it; the global level makes it available in every repo.

```
git config --global alias.lg "log --oneline --graph --decorate --all"
git lg
```

Git aliases take extra arguments: `git lg -5` works. An alias that starts with `!` is run by the shell instead of git, so it can chain several commands, use pipes, or call scripts:

```
git config --global alias.wip '!git add -A && git commit -m wip'
```

Shell aliases always run from the repository's top-level folder. Use single quotes around them so the shell does not interpret `!`.

## Try it

1. Create a global alias `lg` for a decorated graph log of all branches, and run it.
2. Create a global alias `wip` that stages everything and commits with the message `wip`, as above.
3. There is an untracked note in `notes/`. Run `git wip` and check the result with `git lg`.
4. `git config --get-regexp alias` lists every alias you have.

## What just happened

Both aliases are plain lines in this lesson's global config. On your own machine that is `~/.gitconfig`, and they would work in every repository from then on; in Canopy each lesson starts with a fresh global file. The first saves typing; the second packages two commands into one habit. Aliases that run shell commands are the start of a personal toolkit; keep them small and readable.
