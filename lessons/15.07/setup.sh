#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
at 2024-11-05T09:00
write README.md "# Catalogue" "" "A searchable plant catalogue."
write index.html "<h1>Catalogue</h1>"
commit "Start the catalogue"
write index.html "<h1>Catalogue</h1>" "<ul id=\"plants\"></ul>"
commit "Add the plant list"
mark main-tip

git checkout -q -b feature
as sam
write index.html "<h1>Catalogue</h1>" "<input id=\"search\" placeholder=\"Search plants\">" "<ul id=\"plants\"></ul>"
commit "Add search box"
mark f1
write search.js "const box = document.getElementById('search');" "box.addEventListener('input', filterPlants);"
commit "Filter the list as you type"
mark f2
write README.md "# Catalogue" "" "A searchable plant catalogue." "" "Type in the search box to filter the list."
commit "Document the search box"
mark f3
as alex
git checkout -q main

# A colleague's clone, at main, without the feature branch.
git clone -q --single-branch -b main "$LESSON_ROOT/project" "$LESSON_ROOT/colleague" 2>/dev/null
