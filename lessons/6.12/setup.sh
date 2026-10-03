#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo cafe
write README.md "# Hilltop Cafe" "" "Website and menu for the cafe on the hill."
write index.html "<h1>Hilltop Cafe</h1>" "<p>Fresh bread every morning.</p>"
write menu.md "# Menu" "" "- Coffee 2.50" "- Tea 2.00"
commit "Add site skeleton"
mark base

git switch -q -c search
as sam
write index.html "<h1>Hilltop Cafe</h1>" "<input id=\"search\" placeholder=\"Search the menu\">" "<p>Fresh bread every morning.</p>"
write menu.md "# Menu" "" "- Coffee 2.50" "- Tea 2.00" "" "Use the search box to filter this list."
commit "Add a search box to the home page and menu"
mark search1
write search.js "const box = document.querySelector('#search');" "box.addEventListener('input', filterMenu);"
commit "Add search script"
mark search-tip

git switch -q main
as alex
write index.html "<h1>Hilltop Cafe</h1>" "<p>Fresh bread and pastries every morning.</p>"
commit "Mention pastries on the home page"
mark main1
as jordan
write menu.md "# Menu" "" "- Coffee 2.80" "- Tea 2.20"
commit "Raise prices"
mark main2
as alex
append README.md "" "Prices were last updated in January."
commit "Note the price update in README"
mark main-tip
