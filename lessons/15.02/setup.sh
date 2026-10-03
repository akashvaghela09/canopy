#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s15-lib.sh"

make_lib lib 1.0 1.1

# app.git: a project whose main pins lib at 1.0, although lib.git has 1.1.
new_bare app.git
git clone -q "$LESSON_ROOT/app.git" "$LESSON_ROOT/.app-src" 2>/dev/null
cd "$LESSON_ROOT/.app-src"
git checkout -q -b main 2>/dev/null || true
at 2024-11-01T09:00
write README.md "# App" "" "Uses the greeting library."
commit "Start the app"
git -c protocol.file.allow=always submodule add -q ../lib.git lib
git -C lib checkout -q "$(awk -F'\t' '$1=="lib-1-0"{print $3}' "$CANOPY_STATE/marks.tsv")"
git add lib
tick
git commit -q -m "Add lib as a submodule, pinned at 1.0"
mark app-tip
git push -q origin main
cd "$LESSON_ROOT"
rm -rf "$LESSON_ROOT/.app-src"

# The learner's plain clone: the lib folder exists but is empty.
git clone -q "$LESSON_ROOT/app.git" "$LESSON_ROOT/work" 2>/dev/null
