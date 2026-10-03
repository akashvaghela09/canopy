#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
at 2024-02-14T08:00
as alex
commit_file index.html "<h1>Corner Shop</h1>" "Create homepage"
mark homepage

at 2024-02-20T13:00
as sam
commit_file search.html "<input placeholder=\"Search\">" "Add search box"

at 2024-03-03T09:00
as priya
commit_file footer.html "<footer>Corner Shop, est. 2024</footer>" "Add footer"
mark footer

as alex
write index.html "<h1>Corner Shop</h1>" "<p>Open every day.</p>"
git add index.html
