#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo app
write README.md "# Members area"
commit "Add README"
mark readme

write login.html "<h1>Log in</h1>"
commit "Add login page skeleton"
mark skeleton

write login.html "<h1>Log in</h1>" "<form>" "  <input name=\"email\" type=\"email\">" "  <input name=\"password\" type=\"password\">" "  <button>Log in</button>" "</form>"
commit "WIP login form"
mark wip1

write login.css "form { max-width: 20rem; }" "button { background: #2b6cb0; color: white; }"
commit "WIP login styles"
mark wip2
