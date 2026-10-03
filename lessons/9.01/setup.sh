#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo recipes
write README.md "# Family recipes"
commit "Add README"
mark readme

write shopping.md "- eggs" "- flour" "- milk"
commit "Add shopping list"
mark list

write pancakes.md "# Pancakes" "" "- 2 eggs" "- 200 g flour" "- 300 ml milk"
commit "Add recipe for pancaks"
mark typo
