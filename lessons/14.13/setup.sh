#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

# A log file that grows one line per commit: successive versions share
# most of their content, which is what delta compression is good at.
new_repo logbook
at 2024-06-01T08:00
write README.md "# Logbook" "" "One line per day."
write log.txt "day 1: planted beans"
commit "Start the logbook"
mark start
for day in 2 3 4 5 6 7 8 9 10 11 12; do
  append log.txt "day $day: watered, pulled weeds, checked for slugs"
  commit "Log day $day"
done
mark tip
