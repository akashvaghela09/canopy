#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo cafe
write README.md "# Hilltop Cafe" "" "Website and menu for the cafe on the hill."
write prices.txt "Coffee 2.50" "Tea 2.00" "Toast 3.00" "Soup 4.50"
commit "Add price list"
mark base

git switch -q -c pricing
as jordan
write prices.txt "Coffee 2.80" "Tea 2.00" "Toast 3.00" "Soup 4.50" "Cake 3.50"
commit "Raise the coffee price and add cake"
mark pricing-tip

git switch -q -c footer main
as priya
write footer.html "<footer>Hilltop Cafe, Hill Street 1</footer>"
commit "Add page footer"
mark footer-tip

git switch -q main
as alex
write prices.txt "Coffee 2.60" "Tea 2.00" "Toast 3.20" "Soup 4.50"
commit "Adjust coffee and toast prices"
mark main-tip
