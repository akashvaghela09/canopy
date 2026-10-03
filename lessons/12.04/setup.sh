#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s12-team.sh"

goto work
as alex
git switch -q -c feature/reminders
at 2024-03-11T09:00
write src/reminders.js \
  "// Lantern: reminders" \
  "function due(notes, today) {" \
  "  console.log('DEBUG due', notes);" \
  "  return notes.filter((n) => n.remindAt && n.remindAt <= today);" \
  "}" \
  "" \
  "module.exports = { due };"
commit "Add reminders module"

write notes.tmp "scratch: remember to remove the debug line"
write src/cli.js \
  "// Lantern: command-line entry point" \
  "const store = require('./store');" \
  "const reminders = require('./reminders');" \
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
  "  } else if (command === 'due') {" \
  "    reminders.due(notes, new Date().toISOString()).forEach((n) => console.log(n.text));" \
  "  } else {" \
  "    console.log('usage: lantern add <text> | list | due');" \
  "  }" \
  "}" \
  "" \
  "main(process.argv.slice(2));"
commit "Wire reminders into the CLI"

append CHANGELOG.md "- due reminders"
commit "Changelog for reminders"
git push -q -u origin feature/reminders
