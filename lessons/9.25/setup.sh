#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_bare origin.git
clone_repo origin.git work
write app.js "console.log('app');"
commit "Add app"
write README.md "# app" "" "A smal demo app."
commit "Add README"
mark shared
git push -q -u origin main

clone_repo origin.git teammate
as sam
write README.md "# app" "" "A small demo app."
commit "Fix typo in README"
mark sam
git push -q origin main

goto work
as alex
write settings.html "<h1>Settings</h1>"
commit "Add settings page"
mark l1
write tests/settings.test.js "test('settings page', () => {});"
commit "Add settings tests"
mark l2
