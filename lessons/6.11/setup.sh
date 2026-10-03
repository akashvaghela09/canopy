#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo cafe
write README.md "# Hilltop Cafe" "" "Website and menu for the cafe on the hill."
write styles.css "body { font-family: Georgia, serif; }" "h1 { color: #8b4513; }"
write old-notes.txt "Ideas for the site:" "- photos of the counter"
write legacy.py "def print_menu():" "    print('Coffee, Tea')"
commit "Add site files"
mark base

git switch -q -c cleanup
as priya
write styles.css "body { font-family: Helvetica, sans-serif; }" "h1 { color: #8b4513; }"
write CHANGELOG.md "## Unreleased" "" "- Clean up styles" "- Remove old notes"
git rm -q old-notes.txt
append legacy.py "" "def print_prices():" "    print('2.50, 2.00')"
commit "Clean up the site files"
mark cleanup-tip

git switch -q main
as alex
write styles.css "body { font-family: Palatino, serif; }" "h1 { color: #8b4513; }"
write CHANGELOG.md "# Changelog" "" "- Switch heading font"
append old-notes.txt "- a map to the cafe"
git rm -q legacy.py
commit "Retire legacy.py and start a changelog"
mark main-tip
