# Fixture for lesson 3.13 (boss): the "weather-cli" mystery repo.
# Source this AFTER setup-lib.sh. It builds $LESSON_ROOT/weather-cli and
# leaves the shell inside it, on main, with a clean working tree.
#
# Shape (newest first, first-parent order on main):
#   badges    Alex    2024-05-29  Update README badges               <- HEAD, main
#   retry     Priya   2024-05-28  Add retry on network error
#   porto     Sam     2024-05-27  Change default city to Porto
#   merge     Alex    2024-05-24  Merge branch 'fix-units'           <- tag v1.1 (annotated)
#     units-2 Priya   2024-05-23  Document the units flag            <- branch fix-units
#     units-1 Priya   2024-05-22  Support imperial units
#   bug       Jordan  2024-05-21  Tidy temperature constants         (KELVIN_OFFSET 273.15 -> 273.51)
#   rename    Sam     2024-05-20  Rename config.ini to settings.ini
#   changelog Jordan  2024-05-17  Add changelog
#   lisbon    Alex    2024-05-15  Change default city to Lisbon      <- tag v1.0 (annotated)
#   tests     Priya   2024-05-14  Add tests
#   config    Sam     2024-05-13  Add config file
#   start     Alex    2024-05-13  Add weather CLI skeleton
#
# HEAD~4 is "bug": at that point DEFAULT_CITY is still "Lisbon".

new_repo weather-cli

as alex
at 2024-05-13T08:00
write README.md "# weather-cli" "" "Show today's weather for a city from the terminal."
write weather.py 'DEFAULT_CITY = "Oslo"' 'KELVIN_OFFSET = 273.15' 'UNITS = "metric"' '' 'def to_celsius(kelvin):' '    return kelvin - KELVIN_OFFSET'
commit "Add weather CLI skeleton"
mark start

as sam
at 2024-05-13T13:00
write config.ini "[weather]" "city = Oslo" "units = metric"
commit "Add config file"
mark config

as priya
at 2024-05-14T10:00
write tests/test_weather.py 'from weather import to_celsius' '' 'def test_freezing():' '    assert round(to_celsius(273.15)) == 0'
commit "Add tests"
mark tests

as alex
at 2024-05-15T10:00
write weather.py 'DEFAULT_CITY = "Lisbon"' 'KELVIN_OFFSET = 273.15' 'UNITS = "metric"' '' 'def to_celsius(kelvin):' '    return kelvin - KELVIN_OFFSET'
commit "Change default city to Lisbon"
mark lisbon
tick
git tag -a v1.0 -m "First release"

as jordan
at 2024-05-17T10:00
write CHANGELOG.md "# Changelog" "" "## 1.0" "- First release"
commit "Add changelog"
mark changelog

as sam
at 2024-05-20T10:00
git mv config.ini settings.ini
commit "Rename config.ini to settings.ini"
mark rename

git branch fix-units
git checkout -q fix-units
as priya
at 2024-05-22T10:00
write weather.py 'DEFAULT_CITY = "Lisbon"' 'KELVIN_OFFSET = 273.15' 'UNITS = "metric"' '' 'def to_celsius(kelvin):' '    return kelvin - KELVIN_OFFSET' '' 'def to_fahrenheit(kelvin):' '    return to_celsius(kelvin) * 9 / 5 + 32'
commit "Support imperial units"
mark units-1
at 2024-05-23T10:00
append README.md "" "Use --units imperial for Fahrenheit."
commit "Document the units flag"
mark units-2

git checkout -q main
as jordan
at 2024-05-21T10:00
write weather.py 'DEFAULT_CITY = "Lisbon"' 'KELVIN_OFFSET = 273.51  # kelvin to celsius' 'UNITS = "metric"' '' 'def to_celsius(kelvin):' '    return kelvin - KELVIN_OFFSET'
commit "Tidy temperature constants"
mark bug

as alex
at 2024-05-24T10:00
tick
git merge -q --no-ff fix-units -m "Merge branch 'fix-units'" >/dev/null
mark merge
tick
git tag -a v1.1 -m "Add imperial units"

as sam
at 2024-05-27T10:00
write weather.py 'DEFAULT_CITY = "Porto"' 'KELVIN_OFFSET = 273.51  # kelvin to celsius' 'UNITS = "metric"' '' 'def to_celsius(kelvin):' '    return kelvin - KELVIN_OFFSET' '' 'def to_fahrenheit(kelvin):' '    return to_celsius(kelvin) * 9 / 5 + 32'
commit "Change default city to Porto"
mark porto

as priya
at 2024-05-28T10:00
append weather.py '' 'RETRIES = 3'
commit "Add retry on network error"
mark retry

as alex
at 2024-05-29T10:00
write README.md "# weather-cli" "" "![tests](badge-tests.svg) ![version](badge-version.svg)" "" "Show today's weather for a city from the terminal." "" "Use --units imperial for Fahrenheit."
commit "Update README badges"
mark badges

as alex
