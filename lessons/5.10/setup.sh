#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s05-trail.sh"

git branch tmp HEAD~1

git checkout -q -b new-stuff
as sam
write trails/river.md "# River walk" "" "Distance: 6 km" "Climb: gentle" "Best in: spring"
commit "Add river walk"
mark river
