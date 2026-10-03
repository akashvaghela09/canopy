#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo cafe
write README.md "# Hilltop Cafe" "" "Website and menu for the cafe on the hill."
commit "Add README"
write index.html "<h1>Hilltop Cafe</h1>" "<p>Fresh bread every morning.</p>" "<p>Open 7am to 3pm.</p>"
commit "Add home page"
mark fork

git switch -q -c redesign
as priya
write styles.css "body { font-family: Georgia, serif; }" "h1 { color: #8b4513; }"
commit "Add stylesheet"
mark redesign-tip

git switch -q main
as alex
write index.html "<h1>Hilltop Cafe</h1>" "<p>Fresh bread every morning.</p>" "<p>Open 7am to 3pm, closed on Mondays.</p>"
commit "Mention Monday closing on home page"
mark base

git switch -q -c hotfix
as sam
write index.html "<h1>Hilltop Cafe</h1>" "<p>Fresh bread every morning.</p>" "<p>Open 7am to 2pm, closed on Mondays.</p>"
commit "Fix closing time on home page"
mark hotfix-tip

git switch -q main
as alex
