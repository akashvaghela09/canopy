# Shared fixture for section 7 (remotes): the "trails" hiking-club site.
# Source this AFTER setup-lib.sh. It only defines functions; each setup.sh
# calls the ones it needs.
#
#   s07_origin     builds $LESSON_ROOT/origin.git (bare) holding three commits
#                  on main, by three different authors. Leaves the shell in
#                  $LESSON_ROOT. Marks: base, ridge, lake (lake = tip of main).
#   s07_work       clones origin.git into work/ and leaves the shell there.
#   s07_teammate   clones origin.git into teammate/ (Sam's clone) and returns
#                  the shell to work/ if it exists, else $LESSON_ROOT.
#
# History on origin/main (oldest first):
#   base   Alex   Add README
#   ridge  Sam    Add ridge trail            trails/ridge.md
#   lake   Priya  Add lake trail             trails/lake.md
#
# Deterministic: fixed authors and the setup-lib clock, so the marks have the
# same hashes for every learner.

s07_origin() {
  new_bare origin.git
  # Build the history in a scratch clone, push it, then throw the clone away
  # so the learner only ever sees origin.git and the clones made from it.
  new_repo .s07-seed
  as alex
  write README.md "# Trail guide" "" "Notes on the trails near the clubhouse."
  commit "Add README"
  mark base
  as sam
  write trails/ridge.md "# Ridge trail" "" "Distance: 8 km" "Climb: 400 m" "Best in: autumn"
  commit "Add ridge trail"
  mark ridge
  as priya
  write trails/lake.md "# Lake trail" "" "Distance: 5 km" "Climb: 50 m" "Best in: summer"
  commit "Add lake trail"
  mark lake
  as alex
  git push -q "$LESSON_ROOT/origin.git" main
  cd "$LESSON_ROOT"
  rm -rf "$LESSON_ROOT/.s07-seed"
}

s07_work() {
  clone_repo origin.git work
}

s07_teammate() {
  clone_repo origin.git teammate
  if [[ -d "$LESSON_ROOT/work" ]]; then
    goto work
  else
    cd "$LESSON_ROOT"
  fi
}
