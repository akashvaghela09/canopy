#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo recipes
at 2024-08-01T08:00
write chili.md "# Chili" "" "Heat: medium" "Simmer for one hour."
write notes.md "# Notes" "" "Serve warm." "" "Goes well with rice." "" "Keeps for three days."
commit "Add chili recipe"
mark base

git checkout -q -b spicy
as sam
write chili.md "# Chili" "" "Heat: hot" "Simmer for one hour."
commit "Make the chili hot"
write notes.md "# Notes" "" "Serve very warm." "" "Goes well with rice." "" "Keeps for three days."
commit "Clarify serving note"
mark spicy-tip

git checkout -q main
as alex
write chili.md "# Chili" "" "Heat: mild" "Simmer for one hour."
commit "Make the chili mild"
write notes.md "# Notes" "" "Serve warm." "" "Goes well with rice." "" "Keeps for four days in the fridge."
commit "Correct the keeping time"
mark main-tip
