#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo recipes
write pancakes.md "# Pancakes" "" "## Steps"
commit "Add recipe skeleton"
mark base

append pancakes.md "- Fry each side until golden"
commit "Add step: fry the pancakes"
mark fry

write todo.txt "remember to buy eggs"
commit "Add TODO note"
mark todo

append pancakes.md "- Mix flour, eggs and milk"
commit "Add step: mix the batter"
mark mix
