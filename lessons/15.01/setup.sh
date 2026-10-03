#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s15-lib.sh"

make_lib lib 1.0

# The learner's project, with its own origin so that ../lib.git resolves
# relative to it.
new_bare app.git
clone_repo app.git app
git checkout -q -b main 2>/dev/null || true
at 2024-11-01T09:00
write README.md "# App" "" "Uses the greeting library."
commit "Start the app"
mark app-tip
git push -q origin main
