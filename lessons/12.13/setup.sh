#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s12-team.sh"

# v1.0.0 was released at the current tip of main.
goto teammate
as alex
at 2024-03-08T15:00
git tag -a v1.0.0 -m "Lantern 1.0.0"
git push -q origin v1.0.0

# The learner's feature branch, pushed as a backup, with a leftover debug line.
goto work
git fetch -q --tags origin
as alex
git switch -q -c feature/export
at 2024-03-11T09:00
write src/export.js \
  "// Lantern: export notes as plain text" \
  "function exportNotes(notes) {" \
  "  console.log('DEBUG exporting', notes.length);" \
  "  return notes.map((n, i) => (i + 1) + '. ' + n.text).join('\n');" \
  "}" \
  "" \
  "module.exports = { exportNotes };"
commit "Add plain-text export"
append CHANGELOG.md "- export notes as text"
commit "Changelog for export"
git push -q -u origin feature/export
git switch -q main

# Meanwhile Sam pushes to main.
goto teammate
as sam
at 2024-03-12T10:00
append README.md "" "## Tips" "" "Notes are plain JSON; back up notes.json with the rest of your files."
commit "Add a tips section to the README"
git push -q origin main
mark sam-tip

goto work
