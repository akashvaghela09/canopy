#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo tool
write README.md "# csvtool" "" "Small helper for cleaning CSV exports."
commit "Add README"
mark readme

write parser.py "def parse(line):" "    return [cell.strip() for cell in line.split(',')]"
commit "Add CSV parser"
mark parser

write settings.json "{" "  \"delimiter\": \",\"," "  \"skip_header\": true" "}"
write debug.log "2024-01-02 10:00:01 parse called with 'a, b ,c'" "2024-01-02 10:00:01 result ['a', 'b', 'c']"
commit "Add settings and debug output"
mark bundled
