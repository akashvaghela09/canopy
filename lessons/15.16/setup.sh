#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

# Thirty small commits, all loose objects.
new_repo history
at 2024-11-24T08:00
write README.md "# Counter" "" "One commit per count."
write count.txt "0"
commit "Start counting"
for n in $(seq 1 29); do
  write count.txt "$n"
  commit "Count $n"
done
mark tip
