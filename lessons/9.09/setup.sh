#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo shop
write products.js "export const products = [{ name: 'Mug', price: 8.5 }];"
commit "Add product list"
mark products

write cart.js "export function total(items) {" "  return items.reduce((s, i) => s + i.price, 0);" "}"
commit "Add cart"
mark fork

git switch -q -c search
write search.js "export function search(q) { return products.filter(p => p.name.includes(q)); }"
commit "Add search box"
mark s1
write results.html "<ul id=\"results\"></ul>"
commit "Add search results page"
mark s2
write search.css "#results li { padding: 4px; }"
commit "Style search box"
mark s3

git switch -q main
as sam
write footer.html "<footer>Shop Ltd</footer>"
commit "Add footer"
mark m1
write cart.js "export function total(items) {" "  return Number(items.reduce((s, i) => s + i.price, 0).toFixed(2));" "}"
commit "Fix cart total"
mark main-tip
as alex
git switch -q search
