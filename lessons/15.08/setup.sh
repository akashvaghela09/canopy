#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo upstream
as sam
at 2024-11-08T09:00
write config.txt "level = 1" "name = demo"
write README.md "# Demo"
commit "Start the demo"
mark start

# The learner's copy was taken here, then disconnected.
git clone -q "$LESSON_ROOT/upstream" "$LESSON_ROOT/work" 2>/dev/null

# Upstream moves on with three commits...
write config.txt "level = 1" "name = demo" "color = blue"
commit "Add color option"
mark p1
write config.txt "level = 2" "name = demo" "color = blue"
commit "Raise level to 2"
mark p2
write docs.md "# Docs" "" "Set level and color in config.txt."
commit "Add docs page"
mark p3
# ...and mails them as patches.
git format-patch -q -3 -o "$LESSON_ROOT/patches" >/dev/null

# Meanwhile the learner changed the same line locally.
goto work
git remote remove origin
as alex
write config.txt "level = 3" "name = demo"
commit "Try level 3 locally"
mark local
