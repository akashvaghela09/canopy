#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo shop
write products.js "export const products = [" "  { name: 'Mug', price: 8.5 }," "  { name: 'Poster', price: 12 }," "];"
commit "Add product list"
mark products

write cart.js "export function total(items) {" "  return items.reduce((sum, i) => sum + i.price, 0);" "}"
commit "Add cart"
mark main-tip

git switch -q -c checkout
as priya
write checkout.html "<h1>Checkout</h1>" "<form><button>Pay</button></form>"
commit "Add checkout page"
mark c1

write cart.js "export function total(items) {" "  const sum = items.reduce((sum, i) => sum + i.price, 0);" "  return Number(sum.toFixed(2));" "}"
commit "Fix price rounding in cart"
mark fix

write tests/checkout.test.js "test('checkout page renders', () => {});"
commit "Add checkout tests"
mark c3
as alex
