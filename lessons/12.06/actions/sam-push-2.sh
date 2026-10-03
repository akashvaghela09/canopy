#!/usr/bin/env bash
# Sam adds src/count.js on main and pushes. Does nothing if already pushed.
source "$CANOPY_LIB/setup-lib.sh"
goto teammate
as sam
git fetch -q origin
git switch -q main
git reset -q --hard origin/main
if [[ -f src/count.js ]]; then
  echo "Sam already pushed the count command."
  exit 0
fi
tick 1800
write src/count.js "// Lantern: count notes" "function count(notes) {" "  return notes.length;" "}" "" "module.exports = { count };"
commit "Add count command"
git push -q origin main
echo "Sam pushed 'Add count command' to main."
