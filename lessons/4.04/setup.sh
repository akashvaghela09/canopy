#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo site
write README.md "# Garden club site"
commit "Add README"
mark readme

write index.html "<h1>Garden club</h1>" "<p>We meet on the first Saturday of the month.</p>"
commit "Add homepage"
mark home

as jordan
write tracker.js "// sends every click to analytics.example" "document.addEventListener('click', () => fetch('https://analytics.example/hit'));"
append index.html "<script src=\"tracker.js\"></script>"
commit "Add tracking script"
mark tracker

as priya
write about.md "# About" "" "Founded in 2019 by four neighbours."
commit "Add about page"
mark about
