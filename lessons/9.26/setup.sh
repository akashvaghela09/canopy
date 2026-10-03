#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_bare origin.git
clone_repo origin.git work
write app.js "console.log('app');"
commit "Add app"
mark m0
git push -q -u origin main

git switch -q -c login
write login.html "<h1>Log in</h1>"
commit "Add login page"
mark l1
write login.html "<h1>Log in</h1>" "<form><input name=\"user\"><input name=\"password\" type=\"password\"></form>"
commit "Add logn form"
mark typo
git push -q -u origin login

clone_repo origin.git teammate
git switch -q login
git switch -q main
as sam
write footer.html "<footer>Shop Ltd</footer>"
commit "Add footer"
mark m1
git push -q origin main
as alex

goto work
