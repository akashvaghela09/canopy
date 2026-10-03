#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
write app.py "print('app')"
write old-draft.txt "Scrap this. The real text is in app.py now."
write secrets.env "API_KEY=abc123"
commit "Add app, draft and env file"
