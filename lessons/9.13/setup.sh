#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo tool
write cli.py "import sys" "" "def main(argv):" "    print('tool', argv)" "" "if __name__ == '__main__':" "    main(sys.argv[1:])"
commit "Add CLI skeleton"
mark c1

write help.txt "usage: tool [--version] <file>"
commit "Add help text"
mark c2

write debug.py "print('DEBUG: starting')"
commit "Add debug prints"
mark c3

append debug.py "print('DEBUG: argv parsed')"
commit "More debug output"
mark c4

write cli.py "import sys" "" "VERSION = '0.1'" "" "def main(argv):" "    if argv == ['--version']:" "        print(VERSION)" "        return" "    print('tool', argv)" "" "if __name__ == '__main__':" "    main(sys.argv[1:])"
commit "Add version flag"
mark c5

write README.md "# tool" "" "A tiny command line tool."
commit "Add README"
mark c6
