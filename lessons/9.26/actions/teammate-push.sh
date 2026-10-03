#!/usr/bin/env bash
# Sam adds a commit on top of whatever origin's login branch is now.
source "$CANOPY_LIB/setup-lib.sh"
goto teammate
as sam
git fetch -q origin
git switch -q login 2>/dev/null || git switch -q -c login origin/login
git reset -q --hard origin/login
if git cat-file -e HEAD:logout.html 2>/dev/null; then
  echo "Sam's commit is already on origin/login."
  exit 0
fi
write logout.html "<a href=\"/logout\">Log out</a>"
commit "Add logout link"
git push -q origin login
echo "Sam pushed \"Add logout link\" to login."
