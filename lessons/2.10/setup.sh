#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
write app.js "console.log('hi');"
write README.md "# App"
commit "Add app"

write build/app.min.js "console.log('hi')"
write build/report.txt "built in 0.4s"
write debug.log "lots of noise"
write trace.log "more noise"
write audit.log "2024-03-01 release approved by Priya"
write notes.txt "ship on friday"
