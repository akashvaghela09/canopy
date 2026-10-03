#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo server
write README.md "# Tiny server" "" "Settings live in settings.conf."
write settings.conf "port = 8080" "timeout = 30" "retries = 3"
commit "Add server settings"
mark first

as sam
write settings.conf "port = 8080" "timeout = 30" "retries = 3" "log_level = info"
commit "Add log level setting"
mark good

as jordan
write settings.conf "port = 8080" "timeout = 5" "log_level = info"
commit "Shorten timeout"
mark broken
