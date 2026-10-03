#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
write recipe.txt "Pancakes" "2 eggs" "1 cup milk"
commit "Add pancake recipe"

write recipe.txt "Pancakes" "3 eggs" "1 cup milk"
git add recipe.txt
write recipe.txt "Pancakes" "3 eggs" "1 cup milk" "a pinch of salt"
