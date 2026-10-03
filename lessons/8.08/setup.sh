#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo work
write README.md "# Garden planner" "" "Plan what to plant and when."
write lib.py "def area(r):" "    return 3.14 * r"
write app.py "from lib import area" "" "def plan(beds):" "    return [b for b in beds if b.sunny]"
commit "Add planner with area helper"
mark base

# Half-finished feature work in the main worktree.
write app.py "from lib import area" "" "def plan(beds):" "    return [b for b in beds if b.sunny]" "" "def export(beds, path):" "    # TODO: write CSV" "    pass"
