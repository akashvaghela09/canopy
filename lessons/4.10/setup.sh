#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo handbook
write README.md "# Team handbook"
write chapter1.md "# Chapter 1: How we work" "" "We write things down."
write notes-private.md "# Private notes" "" "(nothing yet)"
commit "Add handbook skeleton"
mark tip

append chapter1.md "" "We review each other's work before it ships."
write notes-private.md "# Private notes" "" "Ask about the salary review in March."
git add chapter1.md notes-private.md
