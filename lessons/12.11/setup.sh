#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s12-team.sh"

cli_lines() {
  # $1 = indent unit, $2 = usage text, $3 = 1 to include the search command
  local i=$1
  printf '%s\n' \
    "// Lantern: command-line entry point" \
    "const store = require('./store');" \
    "" \
    "const FILE = 'notes.json';" \
    "" \
    "function main(args) {" \
    "${i}const notes = store.load(FILE);" \
    "${i}const command = args[0];" \
    "${i}if (command === 'add') {" \
    "${i}${i}notes.push({ text: args.slice(1).join(' ') });" \
    "${i}${i}store.save(FILE, notes);" \
    "${i}} else if (command === 'list') {" \
    "${i}${i}notes.forEach((n, i) => console.log(i + 1, n.text));"
  if [[ $3 == 1 ]]; then
    printf '%s\n' \
      "${i}} else if (command === 'search') {" \
      "${i}${i}const word = args[1];" \
      "${i}${i}notes.filter((n) => n.text.includes(word)).forEach((n) => console.log(n.text));"
  fi
  printf '%s\n' \
    "${i}} else {" \
    "${i}${i}console.log('$2');" \
    "${i}}" \
    "}" \
    "" \
    "main(process.argv.slice(2));"
}

# Two branches that add the same search command, made in two different ways.
goto work
as alex
at 2024-03-11T09:00
git switch -q -c wide
cli_lines "    " "usage: lantern add <text> | list" 1 > src/cli.js
commit "Reformat cli.js to four spaces and add search command"

git switch -q -c narrow main
cli_lines "  " "usage: lantern add <text> | list" 1 > src/cli.js
commit "Add search command"

# Meanwhile Sam fixes the usage line on main.
goto teammate
as sam
at 2024-03-11T13:00
cli_lines "  " "usage: lantern add <text> | list   (notes live in notes.json)" 0 > src/cli.js
commit "Mention the notes file in the usage line"
git push -q origin main

goto work
git switch -q main
git pull -q --ff-only
mark main-tip
git switch -q narrow
# An unstaged edit with trailing whitespace, waiting on narrow.
append README.md "" "## Search   " "" "lantern search <word> prints matching notes.  "
