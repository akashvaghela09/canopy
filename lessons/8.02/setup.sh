#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo work
write README.md "# Garden planner" "" "Plan what to plant and when."
write app.py "def greet():" "    return 'Hello, gardener'" "" "def plan(beds):" "    return [b for b in beds if b.sunny]"
write config.toml "[ui]" "theme = \"light\"" "units = \"metric\""
commit "Add planner skeleton"
mark base

# Three stashes, oldest first. Each is made on the same commit, so their
# default names are identical.
tick
write config.toml "[ui]" "theme = \"dark\"" "units = \"metric\""
git stash -q
tick
write app.py "def greet():" "    return 'Hello, gardener!'" "" "def plan(beds):" "    return [b for b in beds if b.sunny]"
git stash -q
tick
write README.md "# Garden planner" "" "Plan what to plant and when." "" "## Watering schedule" "- Mondays and Thursdays"
git stash -q

mark cfg-stash 'stash@{2}'
