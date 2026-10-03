#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s14-garden.sh"

# Two untracked files for the learner to put into the index.
write notes.txt "Remember to prune the roses in March."
write extra.txt "Seed order: carrots, peas, beans."
