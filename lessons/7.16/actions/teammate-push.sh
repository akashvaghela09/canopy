#!/usr/bin/env bash
# Sam keeps working. Each press pushes the next commit in this list:
#   1st press: "Add river trail"
#   2nd press: "Fix lake trail distance"
#   later presses: nothing new, Sam only pushes what is already there.
source "$CANOPY_LIB/setup-lib.sh"

goto teammate
as sam

# Catch up with anything already on origin, so the push cannot be rejected.
git pull -q --no-rebase origin main

if ! git cat-file -e HEAD:trails/river.md 2>/dev/null; then
  write trails/river.md "# River trail" "" "Distance: 3 km" "Climb: none" "Best in: spring"
  commit "Add river trail"
elif ! git show HEAD:trails/lake.md | grep -q "Distance: 6 km"; then
  # Portable in-place edit (BSD sed on macOS has no plain -i).
  sed 's/^Distance: 5 km$/Distance: 6 km/' trails/lake.md > trails/lake.md.tmp && mv trails/lake.md.tmp trails/lake.md
  commit "Fix lake trail distance"
else
  echo "Sam has nothing new to push."
fi

git push -q origin main
echo "origin/main as Sam sees it:"
git log --oneline -3
