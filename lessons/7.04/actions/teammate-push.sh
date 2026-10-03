#!/usr/bin/env bash
# Sam adds the river trail in two commits and pushes them to origin.
# Running this twice does nothing new: the commits are only made once, and
# later presses say so.
source "$CANOPY_LIB/setup-lib.sh"

goto teammate
as sam

# Catch up with anything already on origin, so the push cannot be rejected.
git pull -q --no-rebase origin main

if ! git cat-file -e HEAD:trails/river.md 2>/dev/null; then
  write trails/river.md "# River trail" "" "Distance: 3 km" "Climb: none" "Best in: spring"
  commit "Add river trail"
  append trails/river.md "Parking: lay-by at the old mill"
  commit "Add parking note to river trail"
else
  nothing_new=1
fi

git push -q origin main
if [[ -n "${nothing_new:-}" ]]; then
  echo "Sam has nothing new to push."
else
  echo "Sam pushed to origin/main:"
  git log --oneline -3
fi
