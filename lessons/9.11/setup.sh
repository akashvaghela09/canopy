#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo api
write config.toml "[server]" "port = 8080" "limit = 10"
commit "Add config"
mark base

git switch -q -c limits
write docs/limits.md "# Rate limits" "" "The limit applies per client."
commit "Add rate limit docs"
mark f1
write config.toml "[server]" "port = 8080" "limit = 5" "unit = \"requests\""
commit "Lower default limit and add unit"
mark f2
write tests/limits.sh "#!/bin/sh" "grep -q 'limit = ' config.toml"
commit "Add limit tests"
mark f3

git switch -q main
as sam
write config.toml "[server]" "port = 8080" "limit = 20"
commit "Raise default limit to 20"
mark main-tip
as alex
git switch -q limits
