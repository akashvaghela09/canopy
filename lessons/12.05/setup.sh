#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s12-team.sh"

goto work
as alex
git switch -q -c cleanup
at 2024-03-11T09:00
append README.md "" "## Usage" "" "lantern add Buy milk" "lantern list"
write src/config.js \
  "// Lantern: configuration" \
  "const DEFAULT_LIMIT = 10;" \
  "" \
  "function limit(env) {" \
  "  return Number(env.LANTERN_LIMIT) || DEFAULT_LIMIT;" \
  "}" \
  "" \
  "module.exports = { limit };"
commit "stuff"

write test/config.test.js \
  "const { limit } = require('../src/config');" \
  "" \
  "if (limit({}) !== 100) throw new Error('default limit should be 100');" \
  "if (limit({ LANTERN_LIMIT: '5' }) !== 5) throw new Error('env limit should win');" \
  "console.log('config ok');"
commit "more"

write src/config.js \
  "// Lantern: configuration" \
  "const DEFAULT_LIMIT = 100;" \
  "" \
  "function limit(env) {" \
  "  return Number(env.LANTERN_LIMIT) || DEFAULT_LIMIT;" \
  "}" \
  "" \
  "module.exports = { limit };"
commit "fix"
