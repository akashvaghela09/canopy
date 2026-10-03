#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo journal
at 2024-03-04T08:00
commit_file README.md "# Journal" "Start journal"
at 2024-03-04T09:00
commit_file monday.md "Monday: planned the week." "Add Monday entry"
at 2024-03-05T09:00
commit_file tuesday.md "Tuesday: wrote the proposal." "Add Tuesday entry"
mark tuesday
at 2024-03-06T09:00
commit_file wednesday.md "Wednesday: review meeting." "Add Wednesday entry"
mark wednesday
at 2024-03-07T09:00
commit_file thursday.md "Thursday: shipped the proposal." "Add Thursday entry"
mark thursday

at 2024-03-08T09:00
git reset -q --hard HEAD~2
