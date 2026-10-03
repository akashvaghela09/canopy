#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s07-team.sh"

s07_origin
s07_work

# upstream.git: the club's main repository, from which origin.git was forked.
# It has moved on by two commits since the fork.
goto .
git clone -q --bare "$LESSON_ROOT/origin.git" "$LESSON_ROOT/upstream.git"
git clone -q "$LESSON_ROOT/upstream.git" "$LESSON_ROOT/.s07-tmp"
cd "$LESSON_ROOT/.s07-tmp"
as priya
append README.md "" "## Safety" "Tell someone where you are going."
commit "Add safety notice to README"
as jordan
write trails/river.md "# River trail" "" "Distance: 3 km" "Climb: none" "Best in: spring"
commit "Add river trail"
git push -q origin main
cd "$LESSON_ROOT"
rm -rf "$LESSON_ROOT/.s07-tmp"

# The learner's clone also has a leftover remote whose folder is gone.
goto work
as alex
git remote add backup "$LESSON_ROOT/backup.git"
