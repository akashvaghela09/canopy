#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
write config.yml "timeout: 10" "retries: 3"
write README.md "# Checkout service"
commit "Add checkout service config"

write config.yml "timeout: 30" "retries: 3"
git add config.yml
