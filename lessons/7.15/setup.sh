#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s07-team.sh"

s07_origin
s07_work
s07_teammate

# A release-candidate tag was pushed by mistake; both clones have it.
goto work
tick
git tag -a v1.0-rc -m "Release candidate" main~1
git push -q origin v1.0-rc
goto teammate
git fetch -q --tags origin
goto work
