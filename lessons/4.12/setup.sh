#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

# 1. A secret committed by mistake, not yet shared.
new_repo wrong-file
write README.md "# Planning"
commit "Add README"
mark wf-base
write notes.md "# Meeting notes" "" "- Ship on Friday"
write secret.env "API_KEY=sk-live-0000-do-not-commit"
commit "Add meeting notes"
mark wf-bad

# 2. A commit that teammates already have.
new_repo shared
write README.md "# Image service"
commit "Add README"
mark sh-base
write config.yml "cache: true" "workers: 4"
commit "Add config"
mark sh-config
as jordan
write config.yml "cache: false" "workers: 4"
commit "Disable caching"
mark sh-disable
as alex

# 3. A failed experiment: edits, a staged edit, untracked clutter.
new_repo scrap
write README.md "# Forecast model"
commit "Add README"
write model.py "def forecast(data):" "    return sum(data) / len(data)"
write params.txt "window = 7"
commit "Add baseline model"
mark sc-tip
write model.py "def forecast(data):" "    # experiment: weighted average" "    return sum(data) / len(data) * 1.1"
write params.txt "window = 3"
git add params.txt
write try.txt "attempt 1: worse" "attempt 2: much worse"
write out/run1.csv "1,2,3"

# 4. Staged too early.
new_repo too-early
write report.md "# Quarterly report" "" "(draft)"
commit "Start quarterly report"
mark te-tip
write report.md "# Quarterly report" "" "Q3 numbers are not in yet, so this is a placeholder."
git add report.md

goto .
