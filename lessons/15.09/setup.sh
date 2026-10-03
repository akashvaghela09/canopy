#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
at 2024-11-10T09:00
write README.md "# Field notes" "" "Observations from the meadow."
commit "Start field notes"
write notes/april.md "# April" "" "First swallows on the 14th."
commit "Add April notes"
write notes/may.md "# May" "" "Orchids in the lower meadow."
commit "Add May notes"
mark v1
tick
git tag -a v1.0 -m "Spring notes complete"
as priya
write notes/june.md "# June" "" "Hay cut on the 20th."
commit "Add June notes"
write notes/july.md "# July" "" "Dry spell, pond very low."
commit "Add July notes"
mark tip
as alex
