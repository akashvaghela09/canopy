#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo cafe
write README.md "# Hilltop Cafe" "" "Website and menu for the cafe on the hill."
commit "Add README"
write index.html "<h1>Hilltop Cafe</h1>" "<p>Fresh bread every morning.</p>"
commit "Add home page"
mark base

git switch -q -c new-title
as sam
write index.html "<h1>The Hilltop</h1>" "<p>Fresh bread every morning.</p>"
commit "Shorten the site title"
mark title-tip

git switch -q main
as alex
write index.html "<h1>Hilltop Cafe and Bakery</h1>" "<p>Fresh bread every morning.</p>"
commit "Add bakery to the site title"
mark main-tip
