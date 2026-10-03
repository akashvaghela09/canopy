#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo cafe
write README.md "# Hilltop Cafe" "" "Website and menu for the cafe on the hill."
write index.html "<h1>Hilltop Cafe</h1>" "<p>Fresh bread every morning.</p>"
write menu.md "# Menu" "" "- Coffee 2.50" "- Tea 2.00" "- Toast 3.00"
commit "Add site skeleton"
mark base

git switch -q -c analytics
as jordan
write analytics.js "const events = [];"
commit "Start analytics module"
append analytics.js "function track(name) { events.push({ name, at: Date.now() }); }"
commit "Add track()"
append analytics.js "window.addEventListener('load', () => track('page_view'));"
commit "Track page views"
mark analytics-tip

git switch -q -c search main
as sam
write menu.md "# Menu" "" "- Coffee 2.50" "- Tea 2.00 (also iced)" "- Toast 3.00"
commit "Offer iced tea"
write search.js "const box = document.querySelector('#search');" "box.addEventListener('input', filterMenu);"
commit "Add search script"
mark search-tip

git switch -q main
as alex
write menu.md "# Menu" "" "- Coffee 2.50" "- Tea 2.20" "- Toast 3.00"
commit "Raise the tea price"
mark main-tip

git switch -q -c nav
as priya
write nav.html "<nav><a href=\"index.html\">Home</a> <a href=\"menu.md\">Menu</a></nav>"
commit "Add navigation bar"
write index.html "<!--#include file=\"nav.html\" -->" "<h1>Hilltop Cafe</h1>" "<p>Fresh bread every morning.</p>"
commit "Show the navigation bar on the home page"
mark nav-tip

git switch -q main
as alex
