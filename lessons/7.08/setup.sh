#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s07-team.sh"

s07_origin
s07_work
local_config pull.rebase false
s07_teammate

# Sam pushed after the learner cloned, so the learner's first push will be rejected.
goto teammate
as sam
write trails/river.md "# River trail" "" "Distance: 3 km" "Climb: none" "Best in: spring"
commit "Add river trail"
git push -q origin main
mark river
as alex
goto work
