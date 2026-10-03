#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s12-team.sh"

# Sam publishes a branch for review.
goto teammate
as sam
git switch -q -c sam/export
at 2024-03-11T09:00
write src/export.js \
  "// Lantern: export notes as plain text" \
  "function toText(notes) {" \
  "  return notes.map((n, i) => (i + 1) + '. ' + n.text).join('\n');" \
  "}" \
  "" \
  "module.exports = { toText };"
commit "Add plain-text export"
append CHANGELOG.md "- export notes as text"
commit "Mention export in changelog"
git push -q -u origin sam/export
git switch -q main

# The learner has a branch of their own, not published yet.
goto work
git fetch -q origin
as alex
git switch -q -c import-csv
at 2024-03-11T14:00
write src/import.js \
  "// Lantern: import notes from a CSV file" \
  "const fs = require('fs');" \
  "" \
  "function fromCsv(path) {" \
  "  return fs.readFileSync(path, 'utf8').split('\n').filter(Boolean).map((text) => ({ text }));" \
  "}" \
  "" \
  "module.exports = { fromCsv };"
commit "Add CSV import"
append README.md "" "## Import" "" "lantern import notes.csv"
commit "Document CSV import"
