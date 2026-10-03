#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo cafe
as alex
write README.md "# Hilltop Cafe" "" "Website and menu for the cafe on the hill."
commit "Add README"
mark first
as sam
write menu.md "# Menu" "" "- Coffee 2.50" "- Tea 2.00"
commit "Add menu"

git switch -q -c search
as sam
write search.js "const box = document.querySelector('#search');"
commit "Add search box"
append search.js "box.addEventListener('input', filterMenu);"
commit "Filter menu while typing"
mark search-tip

git switch -q main
as alex
write README.md "# Hilltop Cafe" "" "Website and menu for the cafe on the hill, with recipes."
commit "Fix README wording"
tick
git merge -q --no-ff search -m "Merge branch 'search'"
mark merge-search

as jordan
write menu.md "# Menu" "" "- Coffee 2.80" "- Tea 2.20"
commit "Update prices"

git switch -q -c theme
as priya
write theme.css ":root { --bg: #1b1b1b; --fg: #f3f3f3; }"
commit "Add dark theme variables"
append theme.css "body { background: var(--bg); color: var(--fg); }"
commit "Apply theme to body"
mark theme-tip

git switch -q main
as sam
write contact.md "# Contact" "" "Email hello@hilltop.example"
commit "Add contact page"
as alex
tick
git merge -q --no-ff theme -m "Merge branch 'theme'"
mark merge-theme

git switch -q -c hotfix
as jordan
write contact.md "# Contact" "" "Email hello@hilltop-cafe.example"
commit "Fix contact email"
mark hotfix-tip

git switch -q main
as alex
tick
git merge -q --no-ff hotfix -m "Merge branch 'hotfix'"
mark merge-hotfix

write newsletter.md "# Newsletter" "" "Weekly specials by email."
commit "Add newsletter page"
mark tip
git branch -q -d search theme hotfix
