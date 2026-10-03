#!/usr/bin/env bash
# Sam fetches from origin, including tags. Safe to run as often as you like.
source "$CANOPY_LIB/setup-lib.sh"

goto teammate
as sam
# --force: if a tag was corrected and re-pushed, take the new one.
git fetch -q --tags --force origin
echo "Tags in Sam's clone:"
git tag -l
