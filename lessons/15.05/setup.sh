#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s15-lib.sh"

make_lib lib 1.0

# The library maintainer's working copy (used by the lesson action).
git clone -q "$LESSON_ROOT/lib.git" "$LESSON_ROOT/upstream" 2>/dev/null

new_repo app
at 2024-11-01T09:00
write README.md "# App" "" "Will vendor the greeting library under vendor/lib."
commit "Start the app"
mark app-tip
