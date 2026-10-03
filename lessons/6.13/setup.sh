#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo cafe
write README.md "# Hilltop Cafe" "" "Website and menu for the cafe on the hill."
write config.ini "[site]" "name = Hilltop Cafe" "hours = 7-14" "currency = EUR"
commit "Add site config"
mark base

git switch -q -c rename
as sam
write config.ini "[site]" "name = Hilltop Cafe and Bakery" "hours = 7-14" "currency = EUR"
commit "Rename the site"
mark rename-tip

git switch -q main
as alex
write config.ini "[site]" "name = Hilltop Cafe" "hours = 7-15" "currency = EUR"
commit "Stay open an hour longer"
mark main-tip
