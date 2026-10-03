#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
write README.md "# Herb garden" "A plan for the back yard."
write notes.txt "Basil needs sun." "Mint spreads everywhere."
