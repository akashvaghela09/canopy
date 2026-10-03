#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo inventory
write README.md "# Inventory" "" "Counts stock for the shop."
write .gitignore "*.log"
write inventory.py "def total(items):" "    return sum(count for _, count in items)"
commit "Add inventory script"
mark start

as sam
write config.toml "[store]" "name = \"Corner shop\""
commit "Add config"
mark config

as priya
write tests/test_inventory.py "from inventory import total" "" "def test_total():" "    assert total([('apple', 2), ('pear', 3)]) == 5"
commit "Add tests"
mark tests

as jordan
git rm -q tests/test_inventory.py
commit "Remove old tests"
mark bad
as alex

# Staged junk.
write notes-personal.txt "dentist tuesday 9:30" "call mum"
git add notes-personal.txt

# Untracked clutter.
write scratch.txt "try 3 instead of 2?"
write tmp/dump.sql "-- nothing useful"

# Ignored file that must stay.
write inventory.log "2024-01-02 counted 5 items"

# Unfinished debugging edit.
write inventory.py "def total(items):" "    print('DEBUG', items)" "    return sum(count for _, count in items)"
