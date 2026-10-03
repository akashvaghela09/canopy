#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
at 2024-11-26T09:00
write README.md "# Toolkit" "" "Small text tools."
commit "Start the toolkit"
mark base

git checkout -q -b feature
as sam
write parser.py "def parse(line):" "    return line.split(',')"
commit "Add parser"
mark f1
write test_parser.py "from parser import parse" "" "assert parse('a,b') == ['a', 'b']"
commit "Add parser tests"
mark f2
write docs/parser.md "# Parser" "" "Splits a line on commas."
commit "Document parser"
mark f3

as alex
git checkout -q main
write README.md "# Toolkit" "" "Small text tools." "" "See docs/ for each tool."
commit "Point the README at docs"
write LICENSE "MIT"
commit "Add a licence"
mark main-tip

# The rebased copy: same patches, new messages, and the docs commit was
# edited during the rebase so its patch differs.
git checkout -q -b feature-v2 feature
as sam
tick
git rebase -q main
tick
git reset -q --soft HEAD~3
git reset -q
git add parser.py
tick
git commit -q -m "parser: add the module"
mark v1
git add test_parser.py
tick
git commit -q -m "parser: add tests"
mark v2
write docs/parser.md "# Parser" "" "Splits a line on commas and returns the fields."
git add docs
tick
git commit -q -m "parser: write docs"
mark v3
as alex
git checkout -q main
