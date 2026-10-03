#!/usr/bin/env bash
# Sam rewrites main by mistake: drops the two newest commits, adds his own,
# and force-pushes. It happens once: later presses do not repeat it. Once
# origin refuses non-fast-forward pushes, a later press shows Sam's retry
# being refused.
source "$CANOPY_LIB/setup-lib.sh"
goto teammate
as sam
git switch -q main
if git log --format=%s main | grep -qx "Rewrite changelog as a table"; then
  if [[ $(git -C "$LESSON_ROOT/origin.git" config --bool receive.denyNonFastForwards || true) == true ]]; then
    echo "Sam runs: git push --force origin main"
    git push -q --force origin main 2>&1 || echo "origin refused it: main can no longer be rewritten."
  else
    echo "Sam's force-push already happened. He is leaving main alone now."
  fi
  exit 0
fi
git fetch -q origin
git reset -q --hard "$(git rev-parse origin/main~2)"
tick 1800
write CHANGELOG.md "# Changelog" "" "| Version | Notes |" "|---|---|" "| unreleased | add and list notes |"
commit "Rewrite changelog as a table"
git push -q --force origin main
echo "Sam ran: git push --force origin main"
echo "origin/main is now at '$(git log -1 --format=%s origin/main)'."
