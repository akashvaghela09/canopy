# Shared fixture for section 14: the "garden log" repo.
# Source this AFTER setup-lib.sh. It builds $LESSON_ROOT/garden and leaves
# the shell inside it, on main, with a clean working tree.
#
# Deterministic: fixed authors and dates, so every mark and every object id
# is the same for every learner.
#
# Shape (newest first):
#   tip        Jordan  Note update schedule in README      <- HEAD, main
#   merge      Alex    Merge branch 'herbs'                <- tag v1.0 (annotated)
#     herbs-tip Priya  Add mint note                       <- branch herbs
#     herbs-1   Priya  Add herbs page
#   mint       Sam     Add mint to plant list
#   guide      Alex    Add watering guide                  <- tag v0.1 (lightweight)
#   plants     Sam     Add plant list
#   first      Alex    Add README
#   wip-tip    Priya   Add compost ratios                  <- branch wip (off mint, unmerged)
#   wip-1      Priya   Start compost notes
#
# Files on main at tip: README.md, plants.txt, docs/guide.md, docs/herbs.md

new_repo garden

as alex
at 2024-05-01T09:00
write README.md "# Garden log" "" "Notes on what grows in the back garden."
commit "Add README"
mark first

as sam
write plants.txt "tomato" "basil"
commit "Add plant list"
mark plants

as alex
write docs/guide.md "# Watering guide" "" "Water in the morning, not at noon."
commit "Add watering guide"
mark guide
git tag v0.1

git branch herbs
git checkout -q herbs
as priya
write docs/herbs.md "# Herbs" "" "Basil likes sun."
commit "Add herbs page"
mark herbs-1
append docs/herbs.md "Mint spreads fast, keep it in a pot."
commit "Add mint note"
mark herbs-tip

git checkout -q main
as sam
append plants.txt "mint"
commit "Add mint to plant list"
mark mint

as alex
tick
git merge -q --no-ff herbs -m "Merge branch 'herbs'"
mark merge
tick
git tag -a v1.0 -m "First full season"

as jordan
write README.md "# Garden log" "" "Notes on what grows in the back garden." "Updated every weekend."
commit "Note update schedule in README"
mark tip

git branch wip "$(git rev-parse --verify "$(awk -F'\t' '$1=="mint"{print $3}' "$CANOPY_STATE/marks.tsv")")"
git checkout -q wip
as priya
write docs/compost.md "# Compost" "" "Greens and browns."
commit "Start compost notes"
mark wip-1
append docs/compost.md "Two parts brown to one part green."
commit "Add compost ratios"
mark wip-tip

git checkout -q main
as alex
