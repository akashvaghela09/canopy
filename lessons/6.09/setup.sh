#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo cafe
write README.md "# Hilltop Cafe" "" "Website and menu for the cafe on the hill."
commit "Add README"
write tagline.txt "Fresh bread every day"
commit "Add tagline"
mark base

git switch -q -c tagline
as sam
write tagline.txt "Fresh bread and pastries every day"
commit "Mention pastries in the tagline"
write pastries.md "# Pastries" "" "- Croissant 3.50" "- Cinnamon roll 3.80"
commit "Add pastry list"
mark tagline-tip

git switch -q main
as alex
write tagline.txt "Fresh bread every morning"
commit "Say morning, not day, in the tagline"
mark main-tip
