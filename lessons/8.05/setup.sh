#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo work
write .gitignore "*.log"
write README.md "# Garden planner" "" "Plan what to plant and when."
write app.py "def greet():" "    return 'Hello, gardener'" "" "def plan(beds):" "    return [b for b in beds if b.sunny]"
write config.toml "[ui]" "theme = \"light\"" "units = \"metric\""
commit "Add planner skeleton"
mark base

# Tracked edits, an untracked draft, and an ignored log.
write app.py "def greet():" "    return 'Hello, gardener!'" "" "def plan(beds):" "    return [b for b in beds if b.sunny]"
write config.toml "[ui]" "theme = \"dark\"" "units = \"metric\""
write notes/draft.md "# Ideas" "" "- frost warnings"
write debug.log "2024-01-01 10:00 started"
