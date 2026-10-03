#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo greet
write greet.sh "#!/usr/bin/env bash" "echo \"Hello, World!\""
write test.sh "#!/usr/bin/env bash" "# The greeting must be exactly: Hello, World!" "out=\$(bash greet.sh)" "if [ \"\$out\" = \"Hello, World!\" ]; then" "  echo \"ok: \$out\"" "else" "  echo \"FAIL: got '\$out'\" >&2" "  exit 1" "fi"
chmod +x greet.sh test.sh
commit "Add greet script and test"
mark base

write greet.sh "#!/usr/bin/env bash" "name=\${1:-World}" "echo \"Hello, \$name!\""
commit "Add name option"
mark c1

write greet.sh "#!/usr/bin/env bash" "name=\${1:-World}" "if [ \"\$2\" = \"--bye\" ]; then" "  echo \"Goodbye, \$name!\"" "else" "  echo \"Hello, \$name!\"" "fi"
commit "Add goodbye option"
mark c2

write greet.sh "#!/usr/bin/env bash" "name=\${1:-World}" "greeting=Hello" "if [ \"\$2\" = \"--bye\" ]; then" "  greeting=Goodbye" "fi" "echo \"\$greeting \$name!\""
commit "Refactor greeting output"
mark broken

write README.md "# greet" "" "Prints a friendly greeting."
commit "Add README"
mark c4

write LICENSE "MIT"
commit "Add license"
mark c5
