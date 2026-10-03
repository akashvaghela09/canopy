#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s12-team.sh"

# The learner's private branch, pushed only as a backup copy.
goto work
as alex
git switch -q -c tags-ui
at 2024-03-11T09:00
write src/tags.js \
  "// Lantern: tag helpers" \
  "function parseTags(text) {" \
  "  return (text.match(/#\\w+/g) || []).map((t) => t.slice(1));" \
  "}" \
  "" \
  "module.exports = { parseTags };"
commit "Add tag parsing"
append src/tags.js "" "function hasTag(note, tag) {" "  return parseTags(note.text).includes(tag);" "}"
commit "Add hasTag helper"
git push -q -u origin tags-ui

# A branch shared with Sam.
git switch -q -c export-pdf main
at 2024-03-11T11:00
write src/pdf.js \
  "// Lantern: PDF export (work in progress)" \
  "function toPdf(notes) {" \
  "  throw new Error('not implemented');" \
  "}" \
  "" \
  "module.exports = { toPdf };"
commit "Start PDF export"
git push -q -u origin export-pdf
git switch -q main

goto teammate
as sam
git fetch -q origin
git switch -q -c export-pdf origin/export-pdf
at 2024-03-11T15:00
append src/pdf.js "" "// TODO(sam): page size options"
commit "Note page size work"
git push -q origin export-pdf

# Meanwhile main moves on.
git switch -q main
at 2024-03-12T09:00
append README.md "" "## Configuration" "" "Lantern reads notes.json from the current folder."
commit "Document the notes file location"
append CHANGELOG.md "- document notes.json location"
commit "Changelog for config docs"
git push -q origin main
mark main-tip

goto work
git switch -q main
