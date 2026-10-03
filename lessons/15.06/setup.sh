#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s15-lib.sh"

make_lib icons 2.0
make_lib utils 1.0
make_lib fonts 1.0

new_bare app.git
clone_repo app.git app
git checkout -q -b main 2>/dev/null || true
at 2024-11-01T09:00
write README.md "# App" "" "Three outside libraries are needed: icons, utils and fonts."
commit "Start the app"
mark app-tip
git push -q origin main
