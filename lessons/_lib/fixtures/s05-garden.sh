# Shared fixture for section 5 (5.08, 5.09, 5.11): the "garden" repo with
# diverged branches. Source this AFTER setup-lib.sh. It builds
# $LESSON_ROOT/garden and leaves the shell inside it, on main, clean.
#
# Shape (newest first, first-parent order on main):
#   harvest   Sam     Add harvest calendar            <- HEAD, main
#   merge     Alex    Merge branch 'pests'
#     aphids  Jordan  Add aphid treatment             <- branch pests (merged)
#   compost   Alex    Add compost notes
#   watering  Sam     Add watering schedule           <- branch labels (merged, no own commits)
#   plants    Alex    Add plant list
#
#   mint      Priya   Add mint to herbs               <- branch herbs (unmerged)
#   basil     Priya   Add basil to herbs                 (forked from watering)
#
# main..herbs  = basil, mint                      (2 commits)
# herbs..main  = compost, aphids, merge, harvest  (4 commits)
# merge-base main herbs = watering
# branch --merged (on main): labels, main, pests;  --no-merged: herbs

new_repo garden

as alex
at 2024-05-06T09:00
write plants.md "# Plants" "" "- tomato" "- courgette" "- runner bean"
commit "Add plant list"
mark plants

as sam
write watering.md "# Watering" "" "Beds: every evening in July and August." "Pots: every morning."
commit "Add watering schedule"
mark watering

git branch labels
git branch herbs

as alex
write compost.md "# Compost" "" "Turn the heap every two weeks."
commit "Add compost notes"
mark compost

git branch pests
git checkout -q pests
as jordan
write pests.md "# Pests" "" "Aphids: spray with soapy water in the evening."
commit "Add aphid treatment"
mark aphids

git checkout -q main
as alex
tick
git merge -q --no-ff pests -m "Merge branch 'pests'"
mark merge

as sam
write harvest.md "# Harvest" "" "- courgette: July" "- tomato: August" "- runner bean: August"
commit "Add harvest calendar"
mark harvest

git checkout -q herbs
as priya
write herbs.md "# Herbs" "" "- basil (sunny window)"
commit "Add basil to herbs"
mark basil
write herbs.md "# Herbs" "" "- basil (sunny window)" "- mint (keep in a pot, it spreads)"
commit "Add mint to herbs"
mark mint

git checkout -q main
as alex
