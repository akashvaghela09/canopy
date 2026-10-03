#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s07-team.sh"

s07_origin
s07_work
s07_teammate

# Sam pushed a trail after the learner cloned. Not fetched yet.
goto teammate
as sam
write trails/river.md "# River trail" "" "Distance: 3 km" "Climb: none" "Best in: spring"
commit "Add river trail"
git push -q origin main
mark river
as alex
goto work
