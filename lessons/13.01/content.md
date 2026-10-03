Git reads its settings from several files, in order, and the last one read wins:

1. **system**: for every user of the machine (`--system`).
2. **global**: your own, normally `~/.gitconfig` (`--global`). This is where your identity lives.
3. **local**: `.git/config` of one repository (`--local`, the default when writing).
4. **worktree**: `.git/config.worktree`, for one worktree of a repository (`--worktree`). It only exists after `git config extensions.worktreeConfig true`.

A `-c key=value` given on the command line beats all four files.

In Canopy, the global and system files are Canopy's own, and each lesson starts with fresh copies: the global file holds Canopy's defaults and your name and email, the system file holds only a fallback identity, "Canopy Learner". Your real `~/.gitconfig` is never read or changed, and nothing you set at these levels carries into other lessons, except your name and email.

Useful commands: `git config --list --show-origin` prints every setting with the file it came from; `git config --get <key>` prints the effective value; `git config <level> --unset <key>` removes a value from one file; `git config <level> -e` opens that file in the editor.

## Try it

1. Run `git config --list --show-origin`. If you set your name in an earlier lesson, `user.name` appears twice: Canopy's fallback in the system file and your own name in the global file. Git reads both, and the later one wins. Answer the two questions in the lesson panel about where `init.defaultbranch` and `pull.rebase` come from.
2. `core.abbrev` controls how many characters `git log --oneline` shows for an id. Set it to `12` at the system level, then look at the log.
3. Set it to `10` at the global level, `8` at the local level, and finally, after enabling `extensions.worktreeConfig` in this repo, `6` at the worktree level. Check the log after each step: the narrowest level wins every time.
4. `git config --show-origin --get core.abbrev` names the winning file.
5. Practise removing values: unset `core.abbrev` at the system and global levels, and unset the local `pull.rebase` that was set in this repo. The local and worktree `core.abbrev` can stay.

## What just happened

Each level is a file, and the narrower file overrides the wider one. Identity and personal preferences belong in global; anything specific to one project belongs in local, where teammates do not see it either, because `.git/config` is never committed.
