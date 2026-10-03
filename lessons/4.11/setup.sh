#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo firmware
write README.md "# Thermostat firmware"
write .gitignore "*.log" "build/"
write src/main.c "int main(void) { return 0; }"
commit "Add firmware skeleton with .gitignore"
mark base

# Untracked clutter.
write scratch.txt "pin 7 = relay?" "check with Sam"
write tmp/old-readings.csv "2024-01-01,19.5" "2024-01-02,20.1"

# Ignored files that must survive.
write flash.log "flashing... ok"
write build/firmware.bin "binary"
