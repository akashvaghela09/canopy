#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
as alex
at 2024-05-01T09:00
write README.md "# Lantern" "" "A small notes tool for the terminal."
write src/app.js "// Lantern" "function main() {" "  console.log('lantern');" "}" "main();"
commit "Add app skeleton"
