#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
write src/app.js "console.log('app');"
write src/util.js "function add(a, b) { return a + b; }"
write README.md "# Calc"
write old.txt "This file is obsolete."
commit "Add calculator project"

write src/app.js "console.log('app');" "console.log('version 2');"
rm old.txt
write src/new.js "export const x = 1;"
write notes.txt "release notes"
