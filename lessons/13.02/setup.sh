#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_bare origin.git
new_repo teammate
as alex
at 2024-05-01T09:00
write README.md "# Lantern" "" "A small notes tool for the terminal."
commit "Add README"
write src/cli.js "// Lantern CLI" "console.log('lantern');"
commit "Add command-line entry point"
git remote add origin "$LESSON_ROOT/origin.git"
git push -q -u origin main
git switch -q -c stale
write old.txt "an abandoned experiment"
commit "Try an idea"
git push -q -u origin stale
git switch -q main

clone_repo origin.git work

# After the clone: the stale branch is deleted on origin and Sam pushes to main.
goto teammate
git push -q origin --delete stale
git branch -q -D stale
as sam
at 2024-05-02T10:00
write src/store.js "// Lantern storage" "module.exports = { load() { return []; } };"
commit "Add note storage"
git push -q origin main
mark sam-tip

# The learner has an unpushed commit and an uncommitted edit waiting.
goto work
as alex
at 2024-05-02T12:00
write docs/usage.md "# Usage" "" "lantern add <text>"
commit "Add usage notes"
append README.md "" "## Status" "" "Work in progress."
