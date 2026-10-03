#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo sketch
at 2024-06-10T08:00
write README.md "# Sketches" "" "Ideas for the front garden."
commit "Add README"
write ideas.txt "- a bench under the apple tree"
commit "First idea"
append ideas.txt "- a gravel path to the shed"
commit "Second idea"
mark tip

# Two commits on a scratch branch, then the branch is deleted and the
# reflogs are cleared, so the commits and their files are unreachable.
git checkout -q -b scratch
write scratch.txt "pond? probably too much work"
commit "Scratch: pond idea"
mark lost-1
append scratch.txt "fountain? even more work"
commit "Scratch: fountain idea"
mark lost
git checkout -q main
git branch -D scratch >/dev/null
git reflog expire --expire=now --all
