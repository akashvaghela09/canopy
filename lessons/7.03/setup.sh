#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s07-team.sh"

s07_origin
s07_work
s07_teammate

# Sam pushes a commit; the learner's clone fetches it, so origin/main moves.
goto teammate
as sam
write trails/river.md "# River trail" "" "Distance: 3 km" "Climb: none" "Best in: spring"
commit "Add river trail"
git push -q origin main
mark river

# The learner also made a commit on main (before this lesson), so the two
# branches now point to different commits.
goto work
as alex
append README.md "" "Maps are in the clubhouse hallway."
commit "Mention the paper maps"
mark mine
git fetch -q origin
