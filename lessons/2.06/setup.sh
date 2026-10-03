#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
write app.py "def main():" "    print('hello')"
write README.md "# Greeter"
commit "Add greeter"

write app.py "def main():" "    print('hello, world')"
write README.md "# Greeter" "" "Prints a greeting."
write TODO.md "- add tests"
