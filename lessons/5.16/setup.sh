#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s05-trail.sh"

tick
git tag -a v1.0 -m "Trail guide 1.0" "$(git rev-parse HEAD~1)"
git tag scratch "$(git rev-parse HEAD~3)"
