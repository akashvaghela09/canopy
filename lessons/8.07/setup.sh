#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo work
write README.md "# Garden planner" "" "Plan what to plant and when."
write app.py "def fetch_forecast(city):" "    return http_get(FORECAST_URL + city)"
commit "Add forecast fetcher"
mark base

# Stash made on the first commit...
tick
write app.py "def fetch_forecast(city):" "    retries = 3" "    return http_get(FORECAST_URL + city, retries=retries)"
git stash push -q -m "retry failed forecast requests"

# ...then main moved on and rewrote the same function.
as priya
write app.py "def fetch_forecast(city, units='metric'):" "    url = f'{FORECAST_URL}{city}?units={units}'" "    return http_get(url)"
commit "Support imperial units in forecast"
mark newer
as alex
