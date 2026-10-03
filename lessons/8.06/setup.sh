#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo work
write README.md "# Garden planner" "" "Plan what to plant and when."
write app.py "def greet():" "    return 'Hello, gardener'" "" "def plan(beds):" "    return [b for b in beds if b.sunny]"
commit "Add planner skeleton"
mark base

# Stash a greeting change...
tick
write app.py "def greet():" "    return 'Hello there, gardener'" "" "def plan(beds):" "    return [b for b in beds if b.sunny]"
git stash push -q -m "warmer greeting"

# ...then a commit changes the same line.
as sam
write app.py "def greet():" "    return 'Hi, gardener!'" "" "def plan(beds):" "    return [b for b in beds if b.sunny]"
commit "Shorten the greeting to Hi!"
mark newer
as alex
