#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo recipes
write README.md "# Family recipes"
commit "Add README"
mark readme

write pancakes.md "# Pancakes" "" "- 2 eggs" "- 200 g flour" "- 300 ml milk"
commit "Add pancakes"
mark pancakes

as priya
write soup.md "# Tomato soup" "" "- 1 kg tomatoes" "- 1 onion" "- 1 l stock"
commit "Add tomato soup"
mark soup

as priya
append soup.md "- a pinch of salt"
commit "Add salt to soup"
mark salt
