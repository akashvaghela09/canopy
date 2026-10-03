#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
as alex
at 2024-05-01T09:00
write README.md "# Lantern" "" "A small notes tool for the terminal."
printf 'Shopping list\r\n- milk\r\n- bread\r\n' > notes.txt
printf '#!/bin/sh\r\necho "building lantern"\r\n' > scripts/build.sh 2>/dev/null || { mkdir -p scripts; printf '#!/bin/sh\r\necho "building lantern"\r\n' > scripts/build.sh; }
mkdir -p assets vendor docs
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89' > assets/logo.png
printf '!function(){var a=1,b=2;console.log(a+b)}();' > vendor/lib.min.js
write docs/internal.md "# Internal notes" "" "Not part of releases."
commit "Add project files"
mark start
