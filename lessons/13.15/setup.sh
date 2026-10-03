#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

as alex
at 2024-05-01T09:00
new_repo work/app
write README.md "# App" "" "The company application."
printf 'Release notes\r\n- first release\r\n' > NOTES.txt
commit "Add app skeleton"
write src/notes.js "// notes module" "// FIXME: remove the hard-coded path" "module.exports = { path: '/tmp/notes.json' };"
write editor.swp "swap"

new_repo personal/blog
at 2024-05-01T10:00
write README.md "# Blog" "" "Personal site."
commit "Add blog skeleton"
write posts/first.md "# First" "" "Hello."
write draft.swp "swap"

goto .
write conf/work.gitconfig "[user]" "	name = Alex Rivera" "	email = alex@acme.example"
write conf/personal.gitconfig "[user]" "	name = Alex" "	email = alex@home.example"

new_bare big.git
git -C "$LESSON_ROOT/big.git" config uploadpack.allowFilter true
git -C "$LESSON_ROOT/big.git" config uploadpack.allowAnySHA1InWant true
new_repo seed
at 2024-05-02T09:00
write README.md "# Monorepo"
write web/index.html "<h1>web</h1>"
write api/server.js "// api"
write mobile/App.swift "// mobile"
write docs/guide.md "# Guide"
commit "Add the monorepo layout"
append api/server.js "// routes"
commit "Add routes note"
git remote add origin "$LESSON_ROOT/big.git"
git push -q -u origin main
cd "$LESSON_ROOT" && rm -rf seed
