#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo shop
write README.md "# Corner shop" "" "Online catalogue for the shop."
commit "Add README"
mark readme

as sam
write products.md "# Products" "" "- Oat milk" "- Rye bread" "- Honey"
commit "Add product list"
mark products

as jordan
write ad.html "<div class=\"banner\">Buy one, get one free!</div>"
commit "Add banner ad"
mark ad

write popup.js "setTimeout(() => alert('Subscribe to our newsletter!'), 3000);"
commit "Add popup"
mark popup
