# Shared fixture for section 5: the "trail-guide" notes repo.
# Source this AFTER setup-lib.sh. It builds $LESSON_ROOT/trail-guide and
# leaves the shell inside it, on main, with a clean working tree and no
# other branches or tags. Lessons add branches on top in their own setup.sh
# (add_winter_branch, defined at the end, is shared by 5.03, 5.06 and 5.07).
#
# Deterministic: fixed authors and dates, so every mark has the same hash.
#
# Shape (newest first), all on main:
#   gear    Alex  Add gear checklist         <- HEAD, main
#   lake    Sam   Add lake loop trail
#   ridge   Alex  Add ridge trail
#   readme  Alex  Add README

new_repo trail-guide

as alex
at 2024-04-02T09:00
write README.md "# Trail guide" "" "Notes on the walks around Pine Hollow."
commit "Add README"
mark readme

write trails/ridge.md "# Ridge trail" "" "Distance: 8 km" "Climb: 400 m" "Best in: spring and autumn"
commit "Add ridge trail"
mark ridge

as sam
write trails/lake.md "# Lake loop" "" "Distance: 5 km" "Climb: flat" "Best in: summer"
commit "Add lake loop trail"
mark lake

as alex
write gear.md "# Gear checklist" "" "- water (1 litre per 2 hours)" "- map" "- rain jacket"
commit "Add gear checklist"
mark gear

# Optional extra for 5.03, 5.06, 5.07: a branch "winter", one commit ahead of
# main, that changes trails/lake.md. Leaves the shell on main as Alex.
add_winter_branch() {
  git branch winter
  git checkout -q winter
  as sam
  write trails/lake.md "# Lake loop" "" "Distance: 5 km" "Climb: flat" "Best in: summer" "" "Icy in winter; bring spikes."
  commit "Add winter note to lake loop"
  mark winter
  git checkout -q main
  as alex
}
