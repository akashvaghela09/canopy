#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
at 2024-11-16T09:00
write README.md "# Tidewatch" "" "Tide tables for the estuary."
commit "Start tidewatch"
write CHANGELOG.md "# Changelog" "" "## Unreleased" "- first tide table"
commit "Start a changelog"
mark tip
# The learner creates a throwaway key pair in keys/; keep it out of commits.
printf 'keys/\n' >>.git/info/exclude
