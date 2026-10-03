#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s05-trail.sh"

git tag v0.1 "$(git rev-parse HEAD~2)"
