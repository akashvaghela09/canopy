#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
write notes.txt "Monday: plan the chapters" "Tuesday: write the opening"
write draft.md "# Chapter one" "" "It was a dark and stormy night."
write README.md "# The Book"
commit "Start the book"
