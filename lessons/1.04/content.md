Every commit records who made it. Git does not guess; you tell it once and it remembers.

    git config --global user.name "Ada Lovelace"
    git config --global user.email "ada@example.com"

`--global` stores a setting for all your repos. Inside Canopy, "global" means the app's own private settings file, not the git settings on your computer. Nothing outside the learning folder changes. Canopy also keeps a fallback name at the system level, so commits still work if you skip this lesson; `--show-origin` shows which level each value comes from.

Without `--global` (or with `--local`) the setting is stored in the current repo only, in its `.git/config`. When both exist, the local value wins. Two ways to read settings back:

    git config --list
    git config --show-origin user.email

The second also prints the file each value comes from.

## Try it

1. Set your name and email globally. Any name and email you like.
2. This project should use a different address. Set `user.email` to `work@example.com` for this repo only.
3. List all settings, then ask where `user.email` comes from. Answer the question.

## What just happened

Settings live in layers: the system file first, then the global file, then the repo's `.git/config`. Git reads all of them, and a later value overrides an earlier one, so the repo's own setting wins. That is why `--show-origin` is the quickest way to settle "which setting is git using?"
