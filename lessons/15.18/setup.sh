#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"
source "$CANOPY_LIB/fixtures/s15-lib.sh"

make_lib lib 1.0

new_bare app.git
clone_repo app.git app
git checkout -q -b main 2>/dev/null || true
at 2024-11-28T09:00
write README.md "# Lantern" "" "A reading-light controller."
write src/lantern.py "def brightness(level):" "    return max(0, min(level, 10))"
write .gitattributes "tests/ export-ignore" ".gitattributes export-ignore"
commit "Start lantern"
write tests/test_lantern.py "from src.lantern import brightness" "" "assert brightness(99) == 10"
commit "Add a brightness test"
mark main-tip
git push -q origin main

git checkout -q -b search
as sam
write src/search.py "def find(items, text):" "    return [i for i in items if text in i]"
commit "Add a search helper"
mark s1
write tests/test_search.py "from src.search import find" "" "assert find(['lamp', 'desk'], 'la') == ['lamp']"
commit "Test the search helper"
mark s2
write README.md "# Lantern" "" "A reading-light controller." "" "Search presets with src/search.py."
commit "Document search"
mark s3
as alex
git checkout -q main

# A colleague's clone at main, for checking the patch series.
git clone -q --single-branch -b main "$LESSON_ROOT/app.git" "$LESSON_ROOT/colleague" 2>/dev/null

# A throwaway signing key for this lesson only.
mkdir -p "$LESSON_ROOT/keys"
ssh-keygen -q -t ed25519 -N "" -C "canopy release key" -f "$LESSON_ROOT/keys/release-key"
