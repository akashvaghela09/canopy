#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
as alex
at 2024-03-04T09:00
write README.md "# Lantern" "" "A small notes tool for the terminal."
write VERSION "1.0.0"
commit "Add README and version file"
write src/cli.js "// Lantern CLI" "console.log('lantern 1.0.0');"
commit "Add command-line entry point"
git tag -a v1.0.0 -m "Lantern 1.0.0"
mark release-1

git switch -q -c develop
as sam
at 2024-03-06T10:00
write src/store.js "// Lantern storage" "module.exports = { load() { return []; } };"
commit "Add note storage"
mark develop-start
