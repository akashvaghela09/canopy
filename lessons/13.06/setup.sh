#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

as alex
at 2024-05-01T09:00
new_repo work/client-app
write README.md "# Client app" "" "Work project. Commits here must use the company address."
commit "Add README"
write TODO.md "- set up the build"

new_repo personal/blog
at 2024-05-01T10:00
write README.md "# Blog" "" "Personal site. Commits here use the home address."
commit "Add README"
write posts/hello.md "# Hello" "" "First post."

goto .
write conf/shared.gitconfig "[alias]" "	st = status -sb" "[core]" "	autocrlf = false"
write conf/work.gitconfig "[user]" "	name = Alex Rivera" "	email = alex@acme.example"
write conf/personal.gitconfig "[user]" "	name = Alex" "	email = alex@home.example"
