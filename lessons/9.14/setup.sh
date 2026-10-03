#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo notes
write notes.md "# Week 3"
commit "Add notes file"
mark c1
append notes.md "" "## Monday" "- planning"
commit "Add Monday notes"
mark c2
append notes.md "" "## Tuesday" "- code review"
commit "Add Tuesday notes"
mark c3
append notes.md "" "## Wednesday" "- release"
commit "Add Wednesday notes"
mark c4
