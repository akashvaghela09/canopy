#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
mkdir -p tools
cp "$LESSON_DIR/files/canopy-merge" "$LESSON_DIR/files/canopy-diff" tools/
chmod +x tools/canopy-merge tools/canopy-diff
as alex
at 2024-05-01T09:00
write greeting.txt "Lantern says hello."
write README.md "# Lantern" "" "tools/ holds two tiny scripts used as diff and merge tools."
commit "Add greeting and lesson tools"
git switch -q -c feature
as sam
at 2024-05-02T09:00
write greeting.txt "Lantern says hello." "Tip: tag notes with #words."
commit "Add a tip to the greeting"
git switch -q main
as alex
at 2024-05-02T11:00
write greeting.txt "Lantern says hello." "Run lantern --help for the commands."
commit "Point to --help in the greeting"
