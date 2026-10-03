#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo exporter
at 2024-05-06T09:00
commit_file README.md "# exporter" "Add README"
at 2024-05-06T11:00
write export.py 'import csv' '' 'def export(rows, path):' '    with open(path, "w") as f:' '        csv.writer(f).writerows(rows)'
write docs/export.md "# Export" "" 'Run `exporter export out.csv` to write all rows as CSV.'
commit "Add export command"
mark pre-amend

# A stale staged deletion, then an amend meant to fix only the message.
at 2024-05-06T15:00
git rm -q --cached docs/export.md
tick
git commit -q --amend -m "Add export command (closes #12)"
rm -f docs/export.md
mark amended
