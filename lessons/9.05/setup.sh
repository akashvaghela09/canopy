#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo parser
write parser.py "def parse(text):" "    first, rest = text.split(' ', 1)" "    return {'command': first, 'args': rest}"
commit "Add parser"
mark parser

write README.md "# parser" "" "Turns a line of text into a command."
commit "Add README"
mark main-tip

git switch -q -c wip
as sam
write parser.py "def parse(text):" "    if not text.strip():" "        return None" "    first, _, rest = text.partition(' ')" "    return {'command': first, 'args': rest}"
commit "Fix crash on empty input"
mark crash

write CHANGELOG.md "# Changelog" "" "- Fix crash on empty input"
commit "Start changelog"
mark log1

append CHANGELOG.md "- Document the command format"
commit "Add changelog entry for docs"
mark log2
as alex
git switch -q main
