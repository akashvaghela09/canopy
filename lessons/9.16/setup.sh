#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo auth
write app.py "from flask import Flask" "app = Flask(__name__)"
commit "Add app skeleton"
mark base

write login.html "<form><input name=\"user\"><input name=\"pasword\" type=\"password\"><button>Log in</button></form>"
commit "Add login form"
mark n1
write login.html "<form><input name=\"user\"><input name=\"password\" type=\"password\"><button>Log in</button></form>"
commit "fix typo"
mark n2
write login.css "form { max-width: 20rem; }"
write login.html "<link rel=\"stylesheet\" href=\"login.css\">" "<form><input name=\"user\"><input name=\"password\" type=\"password\"><button>Log in</button></form>"
commit "wip"
mark n3
write reset.html "<link rel=\"stylesheet\" href=\"reset.css\">" "<form><input name=\"email\"><button>Send reset link</button></form>"
commit "Add password reset"
mark n4
write reset.css "form { max-width: 20rem; }"
commit "oops forgot file"
mark n5
