#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo webapp
at 2024-04-15T09:00
commit_file app.py 'ROUTES = ["/"]' "Add app skeleton"
at 2024-04-15T11:00
commit_file login.html "<form action=/login></form>" "Add login page"
mark login
at 2024-04-15T14:00
commit_file signup.html "<form action=/signup></form>" "Add signup page"
mark main-tip

git switch -q -c wip-styles "$(git rev-parse main~1)"
at 2024-04-16T09:00
commit_file styles.css "body { color: #223; } /* WIP palette */" "Try new palette"
mark wip-tip

git switch -q -c feature/search "$(git rev-parse main~1)"
at 2024-04-16T11:00
commit_file search.html "<input name=q placeholder=Search>" "Add search box"
at 2024-04-16T13:00
write search.py 'def search(q, docs):' '    return [d for d in docs if q in d]'
commit "Add search results"
at 2024-04-16T15:00
write search.py 'def search(q, docs):' '    return [d.replace(q, f"<mark>{q}</mark>") for d in docs if q in d]'
commit "Highlight matches"
mark search-orig

# The mistake: rebased onto wip-styles instead of main. It completes cleanly.
at 2024-04-17T09:00
git rebase -q wip-styles >/dev/null 2>&1
