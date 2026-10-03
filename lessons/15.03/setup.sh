#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s15-lib.sh"

make_lib lib 1.0

new_bare app.git
git clone -q "$LESSON_ROOT/app.git" "$LESSON_ROOT/.app-src" 2>/dev/null
cd "$LESSON_ROOT/.app-src"
git checkout -q -b main 2>/dev/null || true
at 2024-11-01T09:00
write README.md "# App" "" "Uses the greeting library."
commit "Start the app"
git -c protocol.file.allow=always submodule add -q ../lib.git lib
tick
git commit -q -m "Add lib as a submodule"
mark app-tip
git push -q origin main
cd "$LESSON_ROOT"
rm -rf "$LESSON_ROOT/.app-src"

# The learner's clone, submodule already initialised.
git -c protocol.file.allow=always clone -q --recurse-submodules "$LESSON_ROOT/app.git" "$LESSON_ROOT/work" 2>/dev/null
