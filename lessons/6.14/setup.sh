#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo cafe
write README.md "# Hilltop Cafe" "" "Website and menu for the cafe on the hill."
commit "Add README"
write index.html "<h1>Hilltop Cafe</h1>" "<p>Fresh bread every morning.</p>"
commit "Add home page"
mark base

git switch -q -c newsletter
as priya
write newsletter.html "<h2>Newsletter</h2>" "<form><input type=\"email\"><button>Sign up</button></form>"
commit "Add newsletter signup form"
write newsletter.js "// TODO: actually send the address somewhere"
commit "Stub the newsletter script"
mark newsletter-tip

git switch -q main
as alex
write contact.md "# Contact" "" "Email hello@hilltop.example"
commit "Add contact page"
mark before
