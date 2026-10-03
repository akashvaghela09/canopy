#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

build() {
  local dir=$1 prefix=$2
  new_repo "$dir"
  as alex
  write app.py "print('hello')"
  commit "Add app"
  write README.md "# app"
  commit "Add README"
  mark "$prefix-fork"
  git switch -q -c feature
  as priya
  write login.py "def login(user): return user == 'admin'"
  commit "Add login page"
  write test_login.py "from login import login" "assert login('admin')"
  commit "Add login tests"
  mark "$prefix-feat"
  git switch -q main
  as sam
  write footer.txt "(c) 2024"
  commit "Add footer"
  mark "$prefix-main"
  as alex
}

build merge-way m
build rebase-way r
cd "$LESSON_ROOT"
