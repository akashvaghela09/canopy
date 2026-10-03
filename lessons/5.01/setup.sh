#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s05-trail.sh"

# A second branch, one commit behind main, so there is something to compare.
git branch weekend-walks HEAD~1
