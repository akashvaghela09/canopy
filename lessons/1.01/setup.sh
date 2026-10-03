#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

mkdir -p notes photos
write welcome.txt "Welcome to Canopy." "Use the terminal to look around."
write notes/monday.txt "Call the plumber."
write notes/tuesday.txt "Water the plants."
write notes/.ideas.txt "Secret plan: learn git."
write photos/holiday.txt "(pretend this is a photo)"
