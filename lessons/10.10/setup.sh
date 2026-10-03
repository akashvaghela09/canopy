#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo ui
at 2024-05-20T09:00
commit_file index.html "<html><body><button id=theme>Theme</button></body></html>" "Add page"
at 2024-05-20T11:00
commit_file styles.css "body { background: white; color: #222; }" "Add styles"
at 2024-05-20T14:00
write app.py 'def render():' '    return "ok"'
commit "Add app"
mark main-tip

# An older stash that stays in the list.
at 2024-05-21T09:00
write index.html "<html><body><button id=theme title='Switch theme'>Theme</button></body></html>"
tick
git stash push -q -m "wip: tooltips"

# The dark-mode work: stashed, then dropped by mistake.
at 2024-05-21T11:00
write styles.css "body { background: white; color: #222; }" "" "body.dark { background: #111; color: #eee; }"
write app.py 'def render():' '    return "ok"' '' 'def toggle_theme(body):' '    body.classes ^= {"dark"}'
tick
git stash push -q -m "wip: dark mode"
mark stash-commit refs/stash
git stash drop -q
