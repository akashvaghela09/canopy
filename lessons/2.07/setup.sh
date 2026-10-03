#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
write poem.txt "Roses are red" "Violets are blue" "Git is a tool" "And so are you"
write config.txt "port: 8080" "debug: false"
commit "Add poem and config"

write poem.txt "Roses are red" "Violets are blue" "Git keeps your history" "And so are you"
write config.txt "port: 9090" "debug: false" "log: info"
