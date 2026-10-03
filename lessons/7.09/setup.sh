#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s07-team.sh"

s07_origin
s07_work
s07_teammate

# On the remote: Sam pushed one commit to main and Priya published a branch.
goto teammate
as sam
write trails/river.md "# River trail" "" "Distance: 3 km" "Climb: none" "Best in: spring"
commit "Add river trail"
git push -q origin main
as priya
git switch -q -c signage
write trails/signage.md "# Signage" "" "Volunteers for repainting the trail markers:" "- Priya"
commit "Start signage volunteer list"
git push -q -u origin signage

# In the learner's clone: two local commits on main, a fetch, and a local
# signage branch created from origin/signage without a tracking link.
goto work
as alex
append README.md "" "Maps are in the clubhouse hallway."
commit "Mention the paper maps"
append trails/ridge.md "Water: none on the trail"
commit "Add water note to ridge trail"
git fetch -q origin
git branch -q --no-track signage origin/signage
