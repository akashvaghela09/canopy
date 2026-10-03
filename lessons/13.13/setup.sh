#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_bare origin.git
new_repo seed
as alex
at 2024-04-01T09:00
write README.md "# Lantern" "" "A small notes tool for the terminal."
commit "Add README"
authors=(sam priya alex jordan)
for i in $(seq 1 11); do
  as "${authors[$((i % 4))]}"
  write "src/change-$i.js" "// change number $i"
  append CHANGELOG.md "- change $i"
  commit "Add change $i"
done
git remote add origin "$LESSON_ROOT/origin.git"
git push -q -u origin main
cd "$LESSON_ROOT" && rm -rf seed
