#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo scratch
at 2024-05-27T09:00
commit_file README.md "# scratch" "Add README"
at 2024-05-27T11:00
commit_file a.txt "alpha" "Add a"
at 2024-05-27T14:00
commit_file b.txt "beta" "Add b"
mark kept
at 2024-05-28T09:00
commit_file c.txt "gamma" "Add c"
mark lost

at 2024-05-28T13:00
git reset -q --hard HEAD~1
