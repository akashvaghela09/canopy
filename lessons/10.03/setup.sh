#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo api
at 2024-04-02T09:00
write server.py 'from http.server import HTTPServer' '' 'PORT = 8080'
commit "Add server"
at 2024-04-02T11:00
commit_file routes.py 'ROUTES = {"/": "index"}' "Add routes"
at 2024-04-03T09:00
write auth.py 'def check_token(token):' '    return token == "secret"'
commit "Add auth middleware"
mark base
at 2024-04-03T14:00
commit_file ratelimit.py 'LIMIT = 100  # requests per minute' "Add rate limiting"
mark rate
at 2024-04-04T09:00
commit_file logging.py 'LOG_FORMAT = "%(asctime)s %(message)s"' "Add request logging"
at 2024-04-04T15:00
write routes.py 'ROUTES = {"/": "index", "/health": "health"}'
commit "Add health endpoint"
mark tip

at 2024-04-05T09:00
git reset -q --hard HEAD~3
