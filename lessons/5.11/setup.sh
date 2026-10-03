#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s05-garden.sh"

# An unmerged branch with one unwanted commit, forked from "Add compost notes".
git branch experiment "$(git rev-parse main~2)"
git checkout -q experiment
as jordan
write beds.md "# Raised beds" "" "Idea: move everything into raised beds? Probably too much work."
commit "Try raised beds"
mark raised
git checkout -q main
as alex
