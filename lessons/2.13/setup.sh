#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
write README.md "# Inventory"
write a.txt "apples"
write c.txt "cherries"
write e.txt "eggs"
commit "Stock the shelves"

write a.txt "apples" "apricots"
write b.txt "bananas"
git add b.txt
write c.txt "cherries" "cranberries"
git add c.txt
write c.txt "cherries" "cranberries" "currants"
write d.txt "dates"
rm e.txt
