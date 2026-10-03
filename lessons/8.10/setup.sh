#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo work
write README.md "# Garden planner" "" "Plan what to plant and when."
write lib.py "def area(r):" "    return 3.14 * r"
write app.py "from lib import area" "" "def plan(beds):" "    return [b for b in beds if b.sunny]"
commit "Add planner with area helper"
mark base

# Half-finished feature: edits to app.py and a new untracked module.
write app.py "from lib import area" "from export import write_rows" "" "def plan(beds):" "    return [b for b in beds if b.sunny]" "" "def export_csv(beds, path):" "    write_rows(path, [(b.name, area(b.radius)) for b in beds])"
write export.py "import csv" "" "def write_rows(path, rows):" "    with open(path, 'w', newline='') as f:" "        csv.writer(f).writerows(rows)"
