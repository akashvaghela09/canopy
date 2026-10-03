#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo site
write index.html "<h1>Studio</h1>" "<p>Welcome.</p>"
commit "Add index page"
mark index

write about.html "<h1>About</h1>" "<p>A two-person design studio.</p>"
commit "Add about page"
mark about

write contact.html "<h1>Contact</h1>" "<p>hello@studio.example</p>"
commit "Add contcat page"
mark typo
