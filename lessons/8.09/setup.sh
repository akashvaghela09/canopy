#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo work
write README.md "# Garden planner" "" "Plan what to plant and when."
write app.py "def plan(beds):" "    return [b for b in beds if b.sunny]"
commit "Add planner skeleton"
mark base

# A review worktree on its own branch.
git branch -q review
git worktree add -q "$LESSON_ROOT/review" review

# A scratch worktree whose folder was deleted by hand.
git worktree add -q "$LESSON_ROOT/scratch" -b scratch
rm -rf "$LESSON_ROOT/scratch"
