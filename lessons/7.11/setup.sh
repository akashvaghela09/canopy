#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s07-team.sh"

s07_origin
s07_work
s07_teammate

# Priya published a branch after the learner cloned.
goto teammate
as priya
git switch -q -c signage
write trails/signage.md "# Signage" "" "Volunteers for repainting the trail markers:" "- Priya"
commit "Start signage volunteer list"
append trails/signage.md "- Sam"
commit "Sam volunteers for signage"
git push -q -u origin signage
mark signage-tip
as alex
goto work
