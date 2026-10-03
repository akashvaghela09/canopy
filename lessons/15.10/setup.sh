#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo app
at 2024-11-12T09:00
write README.md "# Seedling" "" "A tiny web app."
write src/app.js "console.log('seedling');"
write src/index.html "<script src=\"app.js\"></script>"
commit "Start the app"
write tests/app.test.js "test('starts', () => {});"
commit "Add a first test"
write notes/todo.md "- write more tests" "- pick a licence"
commit "Add working notes"
write src/app.js "console.log('seedling 2.0');"
commit "Bump the banner to 2.0"
mark tip
