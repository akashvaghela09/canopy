#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo cafe
write README.md "# Hilltop Cafe" "" "Website and menu for the cafe on the hill."
commit "Add README"
write menu.py "MENU = [" "    ('Coffee', 2.50)," "    ('Tea', 2.00)," "]"
commit "Add menu data"
mark base

git switch -q -c export
as sam
write export.py "import csv" "" "def export_menu(menu, path):" "    pass"
commit "wip: start export module"
mark export1
write export.py "import csv" "" "def export_menu(menu, path):" "    with open(path, 'w', newline='') as f:" "        writer = csv.writer(f)" "        writer.writerows(menu)"
commit "write rows"
mark export2
write export.py "import csv" "" "def export_menu(menu, path):" "    with open(path, 'w', newline='') as f:" "        writer = csv.writer(f)" "        writer.writerow(['name', 'price'])" "        writer.writerows(menu)"
commit "add header row"
mark export-tip

git switch -q main
as alex
append README.md "" "Run menu.py to print the menu."
commit "Document menu.py"
mark main-tip
