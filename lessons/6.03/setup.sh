#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo cafe
write README.md "# Hilltop Cafe" "" "Website and menu for the cafe on the hill."
commit "Add README"
write index.html "<h1>Hilltop Cafe</h1>" "<p>Fresh bread every morning.</p>"
commit "Add home page"
mark base

git switch -q -c search
as sam
write search.js "const box = document.querySelector('#search');" "box.addEventListener('input', filterMenu);"
commit "Add search box script"
mark search-tip

git switch -q -c theme main
as priya
write theme.css ":root { --bg: #1b1b1b; --fg: #f3f3f3; }"
commit "Add dark theme"
mark theme-tip

git switch -q main
as alex
append README.md "" "Built as a plain static site."
commit "Describe the site in README"
mark main-tip
