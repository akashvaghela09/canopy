#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
at 2024-11-18T09:00
write README.md "# Scheduler" "" "Runs nightly jobs."
write config.yaml "retries: 3" "timeout: 30" "backend: new-queue"
commit "Start the scheduler"
mark base

git checkout -q -b legacy-fix
as sam
write config.yaml "retries: 5" "timeout: 30" "backend: legacy-queue"
commit "Switch back to the legacy queue"
write config.yaml "retries: 5" "timeout: 60" "backend: legacy-queue"
commit "Raise the legacy timeout"
mark legacy-tip
as alex
git checkout -q main
write README.md "# Scheduler" "" "Runs nightly jobs on the new queue."
commit "Mention the new queue in the README"
mark main-tip
