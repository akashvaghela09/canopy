#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_bare upstream.git
new_repo maintainer
as priya
at 2024-03-04T09:00
write README.md "# Lantern" "" "A small notes tool for the termnal."
commit "Add README"
write src/cli.js "// Lantern CLI" "console.log('lantern');"
commit "Add command-line entry point"
git remote add origin "$LESSON_ROOT/upstream.git"
git push -q -u origin main

# The fork was made at this point...
git clone -q --bare "$LESSON_ROOT/upstream.git" "$LESSON_ROOT/fork.git"

# ...and upstream kept moving.
at 2024-03-06T10:00
write src/store.js "// Lantern storage" "module.exports = { load() { return []; } };"
commit "Add note storage"
write CHANGELOG.md "# Changelog" "" "- add and list notes"
commit "Add changelog"
git push -q origin main
mark upstream-tip

clone_repo fork.git work
