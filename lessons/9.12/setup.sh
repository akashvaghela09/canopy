#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo app
write app.js "console.log('app');"
commit "Add app"
write README.md "# app"
commit "Add README"
mark main-tip

git switch -q -c api
as priya
write api.js "export async function get(url) { return fetch(url); }"
commit "Add API client"
mark a1
write api.js "export async function get(url) {" "  const r = await fetch(url);" "  if (!r.ok) throw new Error(r.statusText);" "  return r;" "}"
commit "Add API error handling"
mark a2

git switch -q -c ui
as alex
write settings.html "<h1>Settings</h1>" "<label>Theme <select><option>light</option><option>dark</option></select></label>"
commit "Add settings page"
mark u1
write settings.css "select { font-size: 1rem; }"
commit "Add settings styles"
mark u2
