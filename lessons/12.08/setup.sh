#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s12-team.sh"

goto work
as alex
at 2024-03-11T09:00
write build.sh '#!/usr/bin/env bash' '# Prints the version string baked into a build.' 'echo "lantern $(git describe --tags --always)"'
chmod +x build.sh
commit "Add build script that reports the version"
git push -q origin main
mark before-release
