#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s14-garden.sh"

# Three untracked files: two identical, one different.
write seeds-a.txt "sunflower"
write seeds-b.txt "sunflower"
write seeds-c.txt "sunflower, giant variety"
