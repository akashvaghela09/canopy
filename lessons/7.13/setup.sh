#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s07-team.sh"

s07_origin
s07_teammate

# Before the learner cloned: Sam merged winter-closures into main, left the
# branch on the remote, and also pushed a throwaway branch called scratch.
goto teammate
as sam
git switch -q -c winter-closures
write trails/closures.md "# Winter closures" "" "Ridge trail: closed December to March."
commit "Add winter closure list"
git push -q -u origin winter-closures
git switch -q main
git merge -q --no-ff -m "Merge branch 'winter-closures'" winter-closures
git push -q origin main
mark merged
git branch -q scratch
git push -q origin scratch

# The learner clones (gets main, origin/winter-closures, origin/scratch) and
# has a local tracking branch for winter-closures.
s07_work
git branch -q --track winter-closures origin/winter-closures

# After that, Sam deleted scratch on the remote. The learner's clone still
# has the stale origin/scratch.
goto teammate
git push -q origin --delete scratch
git branch -q -D scratch
as alex
goto work
