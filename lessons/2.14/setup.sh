#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo shop
write app.py "def main():" "    print('Welcome to the shop')"
write helpers.py "def money(x):" "    return f'{x:.2f}'"
write old_notes.txt "Meeting notes from 2019. Nobody remembers what they mean."
write README.md "# Shop"
commit "Initial import"

write build/app.bin "binary blob"
write debug.log "noise noise noise"
