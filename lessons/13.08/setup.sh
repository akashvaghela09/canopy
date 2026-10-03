#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_bare origin.git
cp "$LESSON_DIR/files/pre-receive" "$LESSON_ROOT/origin.git/hooks/pre-receive"
chmod +x "$LESSON_ROOT/origin.git/hooks/pre-receive"

new_repo seed
as alex
at 2024-05-01T09:00
write README.md "# Lantern" "" "A small notes tool for the terminal."
write src/cli.js "// Lantern CLI" "console.log('lantern');"
commit "Add app skeleton"
write src/tags.js "// Lantern: tags" "function parseTags(text) {" "  return (text.match(/#\\w+/g) || []).map((t) => t.slice(1));" "}" "module.exports = { parseTags };"
commit "Add tag parsing"
git remote add origin "$LESSON_ROOT/origin.git"
git push -q -u origin main

# A side branch for the merge later.
git switch -q -c feature/colors
as priya
at 2024-05-02T09:00
write src/colors.js "// Lantern: terminal colours" "module.exports = { green: (s) => '\\x1b[32m' + s + '\\x1b[0m' };"
commit "Add colour helpers"
git push -q -u origin feature/colors
git switch -q main
cd "$LESSON_ROOT" && rm -rf seed

clone_repo origin.git work
as alex
at 2024-05-03T10:00
write src/filter.js "// Lantern: filter notes by tag" "const { parseTags } = require('./tags');" "function byTag(notes, tag) {" "  return notes.filter((n) => parseTags(n.text).includes(tag));" "}" "module.exports = { byTag };"
commit "Add tag filter"
append src/filter.js "// TODO: tests"
commit "wip"
