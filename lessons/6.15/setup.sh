#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo cafe
write README.md "# Hilltop Cafe" "" "Website and menu for the cafe on the hill."
commit "Add README"
write index.html "<h1>Hilltop Cafe</h1>" "<p>Fresh bread every morning.</p>"
commit "Add home page"
mark base

git switch -q -c promo
as jordan
write promo.html "<div class=\"promo\">Two croissants for the price of one, this week only.</div>"
commit "Add promo banner"
write index.html "<h1>Hilltop Cafe</h1>" "<p>Fresh bread every morning.</p>" "<!--#include file=\"promo.html\" -->"
commit "Show the promo on the home page"
mark promo-tip

git switch -q main
as alex
write menu.md "# Menu" "" "- Coffee 2.50" "- Tea 2.00"
commit "Add menu"
mark pre-merge
tick
git merge -q --no-ff promo -m "Merge branch 'promo'"
mark merge

as sam
write contact.md "# Contact" "" "Email hello@hilltop.example"
commit "Add contact page"
mark tip
as alex
