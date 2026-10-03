#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_bare origin.git
clone_repo origin.git work
git checkout -q -b main 2>/dev/null || true
as sam
at 2024-11-14T09:00
write README.md "# Portal" "" "Internal portal."
commit "Start the portal"
mark c1
write login.html "<form><input name=\"user\"><input name=\"pass\" type=\"password\"></form>"
commit "Add login page"
mark c2
write dashboard.html "<h1>Dashboard</h1>"
commit "Add dashboard page"
mark c3
git push -q origin main
as alex
