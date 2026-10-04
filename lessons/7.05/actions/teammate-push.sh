#!/usr/bin/env bash
# Sam keeps working on the lake trail. Each press pushes the next change:
#   1st press: "Fix lake trail distance"
#   2nd press: "Add parking note to lake trail"
#   later presses: one more "Checked:" line each time.
# So there is always something new: pressing early (before your own commit)
# is harmless, because the next press gives you a fresh change to merge.
source "$CANOPY_LIB/setup-lib.sh"

goto teammate
as sam

# Catch up with anything already on origin, so the push cannot be rejected.
git pull -q --no-rebase origin main

if ! git show HEAD:trails/lake.md | grep -q "Distance: 6 km"; then
  # Portable in-place edit (BSD sed on macOS has no plain -i).
  sed 's/^Distance: 5 km$/Distance: 6 km/' trails/lake.md > trails/lake.md.tmp && mv trails/lake.md.tmp trails/lake.md
  commit "Fix lake trail distance"
elif ! git show HEAD:trails/lake.md | grep -q "^Parking:"; then
  append trails/lake.md "Parking: 20 spaces by the boathouse"
  commit "Add parking note to lake trail"
else
  n=$(grep -c "^Checked:" trails/lake.md || true)
  append trails/lake.md "Checked: Sam walked the trail again (visit $((n + 1)))"
  commit "Note another lake trail check"
fi

git push -q origin main
echo "Sam pushed to origin/main:"
git log --oneline -3
