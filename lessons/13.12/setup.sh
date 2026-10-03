#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_bare big.git
new_repo seed
as alex
at 2024-05-01T09:00
write README.md "# Lantern monorepo" "" "web/, api/, mobile/ and docs/ live together here."
write web/index.html "<h1>Lantern</h1>"
write web/app.js "console.log('web');"
write api/server.js "// API server" "console.log('api');"
write api/routes.js "module.exports = ['/notes', '/tags'];"
write mobile/App.swift "// iOS app" "print(\"lantern\")"
write docs/guide.md "# Guide" "" "How to run each part."
commit "Add the monorepo layout"
as sam
at 2024-05-03T10:00
append api/routes.js "// v1 routes above"
commit "Annotate API routes"
git remote add origin "$LESSON_ROOT/big.git"
git push -q -u origin main
git switch -q -c feature/api-v2
as priya
at 2024-05-04T10:00
write api/v2.md "# API v2 plan" "" "- paginate /notes"
commit "Start the API v2 plan"
git push -q -u origin feature/api-v2
cd "$LESSON_ROOT" && rm -rf seed
