# Shared fixture for section 15: a small "greeting" library published in a
# bare repo. Source AFTER setup-lib.sh.
#
#   make_lib <name> [versions...]
#     Creates $LESSON_ROOT/<name>.git (bare, branch main) with one commit
#     per version listed (default: 1.0), authored by Sam, via a temporary
#     clone that is removed afterwards. Files: version.txt, greet.txt.
#     Marks: <name>-<version> for each commit (dots replaced by dashes),
#     <name>-tip for the last one.
#
# Leaves the shell where it was.
make_lib() {
  local name=$1
  shift
  local versions=("$@")
  [[ ${#versions[@]} -eq 0 ]] && versions=(1.0)
  local here
  here=$(pwd)
  new_bare "$name.git"
  git clone -q "$LESSON_ROOT/$name.git" "$LESSON_ROOT/.$name-src" 2>/dev/null
  cd "$LESSON_ROOT/.$name-src"
  git checkout -q -b main 2>/dev/null || true
  as sam
  local v first=1
  for v in "${versions[@]}"; do
    if [[ $first -eq 1 ]]; then
      write greet.txt "hello"
      write version.txt "$v"
      commit "$name $v"
      first=0
    else
      write version.txt "$v"
      commit "$name $v"
    fi
    mark "$name-${v//./-}"
  done
  mark "$name-tip"
  git push -q origin main
  as alex
  cd "$here"
  rm -rf "$LESSON_ROOT/.$name-src"
}
