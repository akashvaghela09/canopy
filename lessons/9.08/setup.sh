#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo app
write app.js "console.log('app 1.0');"
write README.md "# app" "" "Run with node app.js."
commit "Add app"
mark base

git branch release
git switch -q -c feature-export
as priya
write export.js "export function toCsv(rows) {" "  return rows.map(r => r.join(',')).join('\n');" "}"
commit "Add export"
mark feat

git switch -q main
as alex
write README.md "# app" "" "Run with node app.js." "" "See docs/ for the full manual."
commit "Update docs"
mark docs

tick
git merge -q --no-ff feature-export -m "Merge branch 'feature-export'"
mark merge

git switch -q release
as sam
write app.js "console.log('app 1.0.1');"
commit "Bump release version"
mark rel
as alex
git switch -q main
