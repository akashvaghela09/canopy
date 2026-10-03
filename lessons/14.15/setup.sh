#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
at 2024-07-01T08:00
write README.md "# Harvest tracker" "" "Weights of everything picked this year."
commit "Add README"
write data.csv "date,crop,kg" "2024-06-20,strawberries,1.2" "2024-06-28,peas,0.8"
commit "Add first harvest data"
write docs/method.md "# Method" "" "Weigh after washing, before trimming."
commit "Describe the weighing method"
mark tip

# A full copy made while everything was still healthy. --no-hardlinks so the
# backup's object files are real copies, not links to the ones we damage.
git clone -q --no-hardlinks "$LESSON_ROOT/project" "$LESSON_ROOT/backup"

# Damage: replace the loose object holding data.csv with garbage.
goto project
blob=$(git rev-parse HEAD:data.csv)
obj=".git/objects/${blob:0:2}/${blob:2}"
rm -f "$obj"
printf 'this is not a git object\n' >"$obj"
