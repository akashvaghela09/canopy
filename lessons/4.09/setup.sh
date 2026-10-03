#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo deploy
write README.md "# Deploy scripts" "" "Run deploy.sh from the project root."
commit "Add README"
mark readme

write deploy.sh "#!/bin/sh" "rsync -a build/ server:/srv/app/"
commit "Add deploy script"
mark script

write deploy.sh "#!/bin/sh" "set -e" "rsync -a build/ server:/srv/app/" "ssh server systemctl restart app"
commit "Working version"
mark good

write deploy.sh "#!/bin/sh" "set -e" "rsync -a --delete build/ server:/srv/app/" "ssh server systemctl restart app" "ssh server rm -rf /srv/app/cache"
commit "Try new rollout"
mark exp1

write deploy.sh "#!/bin/sh" "set -ex" "rsync -a --delete build/ server:/srv/app/" "# ssh server systemctl restart app" "ssh server reboot"
write experiment.txt "does rebooting fix the cache? (no)"
commit "More experiments"
mark exp2

# Half-finished edits on top: one staged, one not.
append README.md "" "TODO: document the reboot step"
git add README.md
append deploy.sh "echo done???"
