#!/usr/bin/env bash
# Sam adds a changelog line on main and pushes. Does nothing if already pushed.
source "$CANOPY_LIB/setup-lib.sh"
goto teammate
as sam
git fetch -q origin
git switch -q main
git reset -q --hard origin/main
if grep -q "count notes" CHANGELOG.md; then
  echo "Sam already pushed the changelog entry."
  exit 0
fi
tick 1800
append CHANGELOG.md "- count notes"
commit "Mention note counting in changelog"
git push -q origin main
echo "Sam pushed 'Mention note counting in changelog' to main."
