#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo cafe
write README.md "# Hilltop Cafe" "" "Website and menu for the cafe on the hill."
commit "Add README"
write menu.md "# Menu" "" "- Coffee 2.50" "- Tea 2.00"
commit "Add menu"
mark base

git switch -q -c opening-hours
as sam
write hours.md "# Opening hours" "" "Monday to Friday: 7:00 to 15:00"
commit "Add opening hours"
mark hours1
append hours.md "Saturday: 8:00 to 14:00"
commit "Add weekend hours"
mark hours2

git switch -q main
as alex
append README.md "" "Find us at the top of Hill Street."
commit "Add address to README"
mark main-tip
