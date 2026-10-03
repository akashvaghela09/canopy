#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo work
write README.md "# Garden planner" "" "Plan what to plant and when."
write app.py "def greet():" "    return 'Hello, gardener'" "" "def plan(beds):" "    return [b for b in beds if b.sunny]"
commit "Add planner skeleton"
mark base

# A branch where README.md differs, so a dirty switch is refused.
git switch -q -c release-notes
write README.md "# Garden planner" "" "Plan what to plant and when." "" "## Release notes" "- 0.1: first version"
commit "Start release notes"
git switch -q main

# The learner's half-finished edits.
write README.md "# Garden planner" "" "Plan what to plant and when." "" "## Watering schedule" "- Mondays and Thursdays"
write app.py "def greet():" "    return 'Hello, gardener!'" "" "def plan(beds):" "    return [b for b in beds if b.sunny]"
