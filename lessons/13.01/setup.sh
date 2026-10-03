#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
as alex
at 2024-05-01T09:00
write README.md "# Config playground" "" "A repo for trying out configuration levels."
commit "Add README"
write notes.md "Settings live in files; git reads them in order."
commit "Add notes"
local_config pull.rebase true
