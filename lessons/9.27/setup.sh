#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_bare origin.git
clone_repo origin.git work
write app.js "console.log('app');"
commit "Add app"
write README.md "# app" "" "Exports data as CVS files."
commit "Add README"
mark m0
git push -q -u origin main

git switch -q -c feature/export
write export.js "const button = document.createElement('button');" "button.textContent = 'Exprt';" "document.body.append(button);"
commit "Add export button"
mark a
write tests/csv.test.js "import { toCsv } from '../csv.js';" "test('toCsv joins rows', () => {" "  expect(toCsv([['a', 'b']])).toBe('a,b');" "});"
commit "Add tests for CSV export"
mark b
write csv.js "export function toCsv(rows) {" "  return rows.map(r => r.join(',')).join('\n');" "}"
commit "Add CSV exprot"
mark c
write export.js "const button = document.createElement('button');" "button.textContent = 'Export data';" "document.body.append(button);"
commit "Fix export button label"
mark d
write settings.js "export const settings = { delimiter: ',', header: true };"
write README.md "# app" "" "Exports data as CSV files."
commit "Add export settings and fix README typo"
mark e
git push -q -u origin feature/export

clone_repo origin.git teammate
as sam
write README.md "# app" "" "Exports data as CVS or JSON files."
commit "Mention JSON export in README"
mark m1
git push -q origin main
as alex

goto work
