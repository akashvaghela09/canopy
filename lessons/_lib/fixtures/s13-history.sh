# Shared fixture for section 13 (13.03, 13.04): the "garden" journal.
# Source this AFTER setup-lib.sh. Builds $LESSON_ROOT/garden and leaves the
# shell inside it, on main, clean. Deterministic dates and authors.
#
# main (oldest first):
#   2024-04-01 Alex   Start the garden journal
#   2024-04-03 Priya  Add bed layout
#   2024-04-05 Sam    Add seed list
#   2024-04-09 Alex   Add watering schedule
#   2024-04-12 Priya  Record first sprouts            <- tag v0.2 (annotated)
#   2024-04-15 Sam    Add compost notes
#   2024-04-18 Alex   Plan the summer harvest         <- main
# seedlings (off "Add watering schedule"):
#   2024-04-10 Priya  Track seedling heights          <- seedlings

new_repo garden
as alex
at 2024-04-01T08:00
write README.md "# Garden journal" "" "Notes from the back garden."
commit "Start the garden journal"
as priya
at 2024-04-03T09:00
write beds.md "# Beds" "" "- bed 1: tomatoes" "- bed 2: beans"
commit "Add bed layout"
as sam
at 2024-04-05T10:00
write seeds.md "# Seeds" "" "- tomato (Roma)" "- bean (Blue Lake)"
commit "Add seed list"
as alex
at 2024-04-09T07:30
write watering.md "# Watering" "" "- beds: every other morning" "- pots: daily"
commit "Add watering schedule"
mark watering

git switch -q -c seedlings
as priya
at 2024-04-10T18:00
write seedlings.md "# Seedlings" "" "| date | tomato | bean |" "|---|---|---|" "| 04-10 | 2cm | 3cm |"
commit "Track seedling heights"
git switch -q main

as priya
at 2024-04-12T08:00
append README.md "" "First sprouts on 12 April." 
commit "Record first sprouts"
git tag -a v0.2 -m "Garden journal 0.2: first sprouts"
mark sprouts
as sam
at 2024-04-15T12:00
write compost.md "# Compost" "" "Turn the heap every two weeks."
commit "Add compost notes"
as alex
at 2024-04-18T09:00
write harvest.md "# Summer harvest" "" "- tomatoes: late July" "- beans: early August"
commit "Plan the summer harvest"
