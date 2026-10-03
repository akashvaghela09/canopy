#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s07-team.sh"

# Only origin and Sam's clone. The learner makes their own clone.
s07_origin
s07_teammate
