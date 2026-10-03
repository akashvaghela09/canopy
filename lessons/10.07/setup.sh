#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo game
at 2024-04-29T09:00
commit_file player.py 'SPEED = 4' "Add player"
at 2024-04-29T11:00
commit_file physics.py 'GRAVITY = 9.8' "Add physics"
at 2024-04-29T14:00
commit_file jump.py 'JUMP = 12' "Add jumping"
mark jump
at 2024-04-30T09:00
commit_file enemies.py 'ENEMIES = ["slime"]' "Add enemies"
mark main-tip

at 2024-04-30T13:00
git switch -q --detach HEAD~1
write physics.py 'GRAVITY = 6.5  # moon mode'
commit "Experiment with gravity"
write jump.py 'JUMP = 9'
commit "Tune jump height"
mark exp-tip
at 2024-04-30T17:00
git switch -q main 2>/dev/null
