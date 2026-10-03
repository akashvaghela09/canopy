#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
as alex
at 2024-05-01T09:00
write config.txt "# Lantern settings" "timeout = 30" "limit = 100"
commit "Add settings file"
git switch -q -c feature
as sam
at 2024-05-02T09:00
write config.txt "# Lantern settings" "timeout = 60" "limit = 100"
commit "Raise the timeout for slow disks"
git switch -q main
as alex
at 2024-05-02T11:00
write config.txt "# Lantern settings" "timeout = 45" "limit = 100"
commit "Tune the timeout"
