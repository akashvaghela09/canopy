#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo cafe
write README.md "# Hilltop Cafe" "" "Website and menu for the cafe on the hill."
commit "Add README"
write menu.md "# Menu" "" "- Coffee 2.50" "- Tea 2.00" "- Toast 3.00"
commit "Add menu"
mark base

git switch -q -c experiment
as priya
write menu.md "# Menu" "" "- Coffee 2.50" "- Tea 2.00" "- Toast with jam 3.50"
commit "Serve toast with jam"
mark experiment-tip

git switch -q main
as alex
write menu.md "# Menu" "" "- Coffee 2.50" "- Tea 2.00" "- Sourdough toast 3.20"
commit "Switch to sourdough toast"
mark main-tip
