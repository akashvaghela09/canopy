#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo shop
write app.js "console.log('shop');"
commit "Add app"
write README.md "# shop"
commit "Add README"
mark fork

git switch -q -c part1
write db.js "export const db = new Map();"
commit "Add database layer"
mark p1

git switch -q -c part2
write api.js "import { db } from './db.js';" "export const get = (k) => db.get(k);"
commit "Add API layer"
mark p2

git switch -q -c part3
write ui.js "import { get } from './api.js';" "document.title = get('title');"
commit "Add UI layer"
mark p3

git switch -q main
as sam
write ci.yml "on: push" "jobs: { test: { runs-on: ubuntu-latest } }"
commit "Add CI config"
mark main-tip
as alex
git switch -q part3
