#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo shop

as alex
at 2024-06-03T09:00
write products.md "# Products" "" "- notebook" "- pencil set" "- desk lamp"
commit "Add product list"
mark products

as sam
write prices.md "# Prices" "" "- notebook 4.50" "- pencil set 3.00" "- desk lamp 24.00"
commit "Add price list"
mark prices

# A finished branch: its tip is already part of main's history.
git branch old-banner

as priya
write checkout.md "# Checkout" "" "1. Review your basket" "2. Enter a delivery adress" "3. Pay"
commit "Add checkout page"
mark checkout

as alex
write README.md "# Shop" "" "Pages: products, prices, checkout."
commit "Add README"
mark readme

# Real work under a meaningless name.
git checkout -q -b wip
as jordan
write cart.md "# Cart" "" "Items you add appear here until checkout."
commit "Add cart page"
mark cart
git checkout -q main
as alex
