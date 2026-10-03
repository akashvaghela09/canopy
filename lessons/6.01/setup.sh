#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo cafe
write README.md "# Hilltop Cafe" "" "Website and menu for the cafe on the hill."
commit "Add README"
write menu.md "# Menu" "" "- Coffee 2.50" "- Tea 2.00"
commit "Add menu"
mark base

git switch -q -c add-soup
as sam
append menu.md "- Soup of the day 4.50"
commit "Add soup to the menu"
mark soup1
write recipes/soup.md "# Tomato soup" "" "Simmer tomatoes with basil for twenty minutes."
commit "Add soup recipe"
mark soup2
