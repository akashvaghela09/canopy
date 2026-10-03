#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
commit_file README.md "# Field guide" "Add README"
write intro.txt "Welcome to the field guide."
write chapter1.txt "Chapter 1: Trees"
write notes.txt "ideas for later"
