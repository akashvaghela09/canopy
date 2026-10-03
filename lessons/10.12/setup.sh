#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

# Case 1: a bad reset on main.
new_repo case1-reset
write STORY.txt "You ran a hard reset to drop one commit and typed HEAD~2 instead of HEAD~1." "Both \"Add invoice export\" and \"Add PDF footer\" vanished from main."
at 2024-06-03T09:00
commit "Add story"
write invoice.py 'def total(lines):' '    return sum(lines)'
commit "Add invoice model"
write export.py 'def export(inv):' '    return str(inv)'
commit "Add invoice export"
commit_file footer.py 'FOOTER = "Thank you"' "Add PDF footer"
mark c1-tip
tick
git reset -q --hard HEAD~2

# Case 2: a branch deleted with -D.
new_repo case2-branch
write STORY.txt "While cleaning up old branches you deleted feature/invoices with -D." "Its two commits were never merged."
at 2024-06-03T12:00
commit "Add story"
commit_file app.py 'VERSION = "1.0"' "Add app"
mark c2-main
git switch -q -c feature/invoices
commit_file invoices.py 'INVOICES = []' "Add invoice list"
write invoices.py 'INVOICES = []' '' 'def add(inv):' '    INVOICES.append(inv)'
commit "Add invoice creation"
mark c2-tip
git switch -q main
git branch -q -D feature/invoices

# Case 3: rebased onto the wrong branch.
new_repo case3-rebase
write STORY.txt "feature/pdf was meant to be rebased onto main." "It was rebased onto old-base instead, and the rebase finished without conflicts."
at 2024-06-03T15:00
commit "Add story"
commit_file base.py 'BASE = 1' "Add base"
mark c3-fork
git switch -q -c old-base
commit_file old.py 'OLD = True' "Old experiment"
mark c3-old
git switch -q main
commit_file base.py 'BASE = 2' "Update base"
mark c3-main
git switch -q -c feature/pdf "$(git rev-parse main~1)"
write pdf.py 'def render(doc):' '    return b"%PDF-1.4"'
commit "Add PDF renderer"
write pdf.py 'def render(doc):' '    return b"%PDF-1.4 " + doc.encode()'
commit "Embed document text"
mark c3-orig
tick
git rebase -q old-base >/dev/null 2>&1

# Case 4: a dropped stash.
new_repo case4-stash
write STORY.txt "You stashed the half-written retry logic in client.py to pull, then dropped the wrong stash entry."
at 2024-06-04T09:00
commit "Add story"
write client.py 'def fetch(url):' '    return get(url)'
commit "Add client"
mark c4-main
write client.py 'RETRIES = 3' '' 'def fetch(url):' '    for attempt in range(RETRIES):' '        try:' '            return get(url)' '        except IOError:' '            continue'
tick
git stash push -q -m "wip: retry logic"
mark c4-stash refs/stash
git stash drop -q

# Case 5: edits that were never staged, discarded with a restore.
new_repo case5-edit
write STORY.txt "You spent an hour on report.py, never staged it, then discarded the file with a restore to check something." "The working tree is clean now."
at 2024-06-04T12:00
commit "Add story"
write report.py 'def report(rows):' '    return len(rows)'
commit "Add report"
mark c5-main
write report.py 'def report(rows):' '    # an hour of work' '    return {"count": len(rows), "sum": sum(rows)}'
git restore report.py

goto .
