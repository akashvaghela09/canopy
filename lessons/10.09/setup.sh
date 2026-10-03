#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo notes
at 2024-05-13T09:00
write README.md '# notes' '' 'A tiny notes app.'
commit "Add README"
at 2024-05-13T11:00
write notes/first.md '# First note' '' 'Buy coffee beans.'
commit "Add first note"
mark main-tip

# 1. A branch with one commit, deleted later.
git switch -q -c ideas
at 2024-05-14T09:00
write notes/ideas.md '# Ideas' '' '- tag notes' '- search by date' '- export to PDF'
commit "Add idea list"
mark lost-commit
git switch -q main
git branch -q -D ideas

# 2. A file that was staged, then unstaged and deleted: its blob dangles.
write notes/scratch.md "# Scratch" "" "Talk to Sam about the export format." "Ask Priya about search by date."
git add notes/scratch.md
git reset -q
rm notes/scratch.md

# 3. Edits that were never staged: nothing is left of them.
write draft.md "Draft of the announcement (an hour of work)."
write draft.md "TODO"
rm draft.md

# Weeks pass: the reflog expires.
git reflog expire --expire=now --all
