#!/usr/bin/env bash
# Sam adds a parking note at the end of trails/lake.md and pushes it to main.
# Running this twice does nothing new: the note is only committed once, and
# later presses say so.
source "$CANOPY_LIB/setup-lib.sh"

goto teammate
as sam

# Catch up with anything already on origin, so the push cannot be rejected.
git pull -q --no-rebase origin main

if ! grep -q "^Parking:" trails/lake.md; then
  append trails/lake.md "Parking: 20 spaces by the boathouse"
  commit "Add parking note to lake trail"
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
