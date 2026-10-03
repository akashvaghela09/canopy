#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo tool
write tool.sh "#!/bin/sh" "wc -l \"\$1\""
commit "Add CLI skeleton"
mark base
write README.md "# tool" "" "Counts the lines of a file."
commit "Add README"
mark c2
write install.sh "#!/bin/sh" "cp tool.sh /usr/local/bin/tool"
commit "Add install script"
mark c3
write tests.sh "#!/bin/sh" "test \"\$(sh tool.sh README.md | awk '{print \$1}')\" -gt 0"
commit "Add tests"
mark c4
