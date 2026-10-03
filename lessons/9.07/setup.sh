#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo server
write settings.conf "timeout = 30" "retries = 3" "log = info"
commit "Add settings"
mark base

git switch -q -c fixes
as priya
write settings.conf "timeout = 60" "retries = 3" "log = info"
commit "Raise timeout to 60"
mark f1

write settings.conf "timeout = 60" "retries = 5" "log = info"
commit "Raise retries to 5"
mark f2

write settings.conf "timeout = 60" "retries = 5" "log = debug"
commit "Enable debug logging"
mark f3

git switch -q main
as sam
write settings.conf "timeout = 45" "retries = 4" "log = warn"
commit "Tune settings for production"
mark main-tip
as alex
