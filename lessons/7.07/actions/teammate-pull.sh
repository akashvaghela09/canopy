#!/usr/bin/env bash
# Sam pulls main from origin. Safe to run as often as you like.
source "$CANOPY_LIB/setup-lib.sh"

goto teammate
as sam
git pull -q --no-rebase origin main
echo "Sam's clone after pulling:"
git log --oneline -4
