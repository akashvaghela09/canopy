#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_bare origin.git
git -C "$LESSON_ROOT/origin.git" config uploadpack.allowFilter true
git -C "$LESSON_ROOT/origin.git" config uploadpack.allowAnySHA1InWant true

new_repo seed
as alex
at 2024-04-01T09:00
write README.md "# Lantern" "" "A small notes tool for the terminal."
write src/app.js "// Lantern" "console.log('v1');"
write data/words.txt "lantern" "notes" "tags"
commit "Add README, app and word list"
as sam
write src/app.js "// Lantern" "console.log('v2');"
write src/util.js "module.exports = { trim: (s) => s.trim() };"
commit "Add util module and bump app"
as priya
write data/words.txt "lantern" "notes" "tags" "search"
write docs/guide.md "# Guide" "" "Run lantern --help."
commit "Extend word list and add guide"
as alex
write src/app.js "// Lantern" "console.log('v3');"
commit "Bump app to v3"
as jordan
write data/words.txt "lantern" "notes" "tags" "search" "export"
write README.md "# Lantern" "" "A small notes tool for the terminal." "" "See docs/guide.md."
commit "Link the guide from the README"
as sam
write src/app.js "// Lantern" "console.log('v4');"
write src/util.js "module.exports = { trim: (s) => s.trim(), upper: (s) => s.toUpperCase() };"
commit "Add upper helper and bump app"
git remote add origin "$LESSON_ROOT/origin.git"
git push -q -u origin main
cd "$LESSON_ROOT" && rm -rf seed
