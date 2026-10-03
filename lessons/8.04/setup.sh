#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo work
write README.md "# Garden planner" "" "Plan what to plant and when." "" "Run it with: python app.py"
write app.py "def greet():" "    return 'Hello, gardener'" "" "def plan(beds):" "    return [b for b in beds if b.sunny]"
commit "Add planner skeleton"
mark base

# Half-done export feature in app.py, and a small doc fix in README.md.
write app.py "def greet():" "    return 'Hello, gardener'" "" "def plan(beds):" "    return [b for b in beds if b.sunny]" "" "def export(beds, path):" "    # TODO: write CSV" "    pass"
write README.md "# Garden planner" "" "Plan what to plant and when." "" "Run it with: python3 app.py"
