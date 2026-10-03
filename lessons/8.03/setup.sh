#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo work
write README.md "# Garden planner" "" "Plan what to plant and when."
write app.py "def greet():" "    return 'Hello, gardener'" "" "def plan(beds):" "    return [b for b in beds if b.sunny]"
write config.toml "[ui]" "theme = \"light\"" "units = \"metric\""
commit "Add planner skeleton"
mark base

tick
write config.toml "[ui]" "theme = \"light\"" "units = \"metric\"" "" "[dev]" "debug = true" "log_level = \"trace\""
git stash push -q -m "debug settings for local testing"
tick
write app.py "def greet():" "    return 'Hello, gardener!'" "" "def plan(beds):" "    return [b for b in beds if b.sunny]"
git stash push -q -m "wip: friendlier greeting"
