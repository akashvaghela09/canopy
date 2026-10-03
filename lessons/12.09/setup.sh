#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
as alex
at 2024-03-04T09:00
write README.md "# Lantern" "" "A small notes tool for the terminal."
write VERSION "1.0.0"
commit "Add README and version file"
write src/store.js \
  "// Lantern: note storage" \
  "const LIMIT = 100;" \
  "" \
  "function trim(notes) {" \
  "  // keep the most recent notes" \
  "  return notes.slice(0, LIMIT);" \
  "}" \
  "" \
  "module.exports = { trim };"
commit "Add note storage with a size limit"
git tag -a v1.0.0 -m "Lantern 1.0.0"
mark release

as sam
at 2024-03-06T10:00
write src/search.js "// Lantern: search" "function search(notes, word) {" "  return notes.filter((n) => n.text.includes(word));" "}" "module.exports = { search };"
commit "Add search"
as priya
write src/export.js "// Lantern: export" "function toText(notes) {" "  return notes.map((n) => n.text).join('\n');" "}" "module.exports = { toText };"
commit "Add text export"
as alex
append README.md "" "## Commands" "" "add, list, search, export"
commit "Document the commands"
mark main-tip
