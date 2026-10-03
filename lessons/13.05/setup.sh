#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo app
as alex
at 2024-05-01T09:00
write README.md "# App" "" "The application."
write src/main.js "console.log('app');"
commit "Add app skeleton"
write notes.txt.swp "editor swap file"
write .idea/workspace.xml "<project />"
write scratch.md "my private to-do list for this repo"

new_repo docs
at 2024-05-01T10:00
write README.md "# Docs" "" "The handbook."
write guide.md "# Guide"
commit "Add docs skeleton"
write guide.md.swp "editor swap file"
write .idea/workspace.xml "<project />"
write scratch.md "a draft that belongs in this repo soon"

goto .
