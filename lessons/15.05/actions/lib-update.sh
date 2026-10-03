#!/usr/bin/env bash
# The library maintainer publishes version 1.1.
source "$CANOPY_LIB/setup-lib.sh"
goto upstream
as sam
git pull -q --ff-only origin main 2>/dev/null || true
if grep -q "^1.1$" version.txt 2>/dev/null; then
  echo "lib 1.1 is already published."
  exit 0
fi
write version.txt "1.1"
append greet.txt "good morning"
commit "lib 1.1: add a morning greeting"
git push -q origin main
echo "Sam published lib 1.1 to lib.git."
