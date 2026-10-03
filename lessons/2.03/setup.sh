#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
commit_file README.md "# Shopping" "Add README"
write todo.txt "buy milk"
git add todo.txt
write todo.txt "buy milk" "buy bread"
