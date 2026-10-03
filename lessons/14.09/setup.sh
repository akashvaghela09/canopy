#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s14-garden.sh"

# A stale branch for the learner to delete with plumbing.
git branch old-idea v0.1
