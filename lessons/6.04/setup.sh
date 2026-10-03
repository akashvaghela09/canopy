#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo cafe
write README.md "# Hilltop Cafe" "" "Website and menu for the cafe on the hill."
commit "Add README"
write index.html "<h1>Hilltop Cafe</h1>" "<p>Fresh bread every morning.</p>"
commit "Add home page"
mark base

git switch -q -c login
as sam
write login.html "<form>" "  <input name=\"user\">" "  <input name=\"pass\" type=\"password\">" "</form>"
commit "Add login form"
mark login1
write login.js "document.querySelector('form').addEventListener('submit', signIn);"
commit "Wire up the login form"
mark login2

git switch -q main
as alex
