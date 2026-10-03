#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s07-team.sh"

s07_origin
s07_work
s07_teammate

# After the learner cloned, Sam published a branch. The learner's clone has
# not heard of it yet, so only ls-remote shows it.
goto teammate
as sam
git switch -q -c winter-closures
write trails/closures.md "# Winter closures" "" "Ridge trail: closed December to March."
commit "Add winter closure list"
git push -q -u origin winter-closures
as alex
goto work
