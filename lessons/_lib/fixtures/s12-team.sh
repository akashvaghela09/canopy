# Shared fixture for section 12: the "Lantern" notes tool, with a team.
# Source this AFTER setup-lib.sh. It builds:
#   $LESSON_ROOT/origin.git   bare, main only
#   $LESSON_ROOT/teammate     Sam's clone (origin -> origin.git, main tracks origin/main)
#   $LESSON_ROOT/work         the learner's clone
# and leaves the shell inside work, on main, clean. Lessons add their own
# branches and teammate activity on top.
#
# Deterministic: fixed authors and dates. Marks: `base` = tip of main.
#
# History on main (oldest first):
#   skeleton  Alex   2024-03-04  Add README and project skeleton
#   store     Alex   2024-03-05  Add note storage
#   cli       Sam    2024-03-06  Add command-line entry point
#   changelog Priya  2024-03-07  Add changelog
#   install   Alex   2024-03-08  Document how to install            <- main, @mark:base

new_bare origin.git

new_repo teammate
as alex
at 2024-03-04T09:00
write README.md "# Lantern" "" "A small notes tool for the terminal."
write VERSION "0.1.0"
commit "Add README and project skeleton"

at 2024-03-05T10:00
write src/store.js \
  "// Lantern: note storage" \
  "const fs = require('fs');" \
  "" \
  "const LIMIT = 100;" \
  "" \
  "function load(path) {" \
  "  if (!fs.existsSync(path)) return [];" \
  "  return JSON.parse(fs.readFileSync(path, 'utf8'));" \
  "}" \
  "" \
  "function save(path, notes) {" \
  "  fs.writeFileSync(path, JSON.stringify(notes.slice(0, LIMIT), null, 2));" \
  "}" \
  "" \
  "module.exports = { load, save };"
commit "Add note storage"

as sam
at 2024-03-06T11:00
write src/cli.js \
  "// Lantern: command-line entry point" \
  "const store = require('./store');" \
  "" \
  "const FILE = 'notes.json';" \
  "" \
  "function main(args) {" \
  "  const notes = store.load(FILE);" \
  "  const command = args[0];" \
  "  if (command === 'add') {" \
  "    notes.push({ text: args.slice(1).join(' ') });" \
  "    store.save(FILE, notes);" \
  "  } else if (command === 'list') {" \
  "    notes.forEach((n, i) => console.log(i + 1, n.text));" \
  "  } else {" \
  "    console.log('usage: lantern add <text> | list');" \
  "  }" \
  "}" \
  "" \
  "main(process.argv.slice(2));"
commit "Add command-line entry point"

as priya
at 2024-03-07T09:30
write CHANGELOG.md "# Changelog" "" "## Unreleased" "" "- add and list notes"
commit "Add changelog"

as alex
at 2024-03-08T14:00
append README.md "" "## Install" "" "Copy the src folder somewhere on your PATH and run lantern."
commit "Document how to install"
mark base

git remote add origin "$LESSON_ROOT/origin.git"
git push -q -u origin main

clone_repo origin.git work
