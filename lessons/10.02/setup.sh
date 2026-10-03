#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo draft
at 2024-03-04T09:00
write outline.md '# Book' '' '1. The problem' '2. The idea'
commit "Start the draft"
mark a
at 2024-03-06T09:00
write outline.md "# Book" "" "1. The problem" "2. The idea" "3. The plan" "4. Results"
commit "Add outline"
mark b
at 2024-03-08T09:00
write chapter1.md '# The problem' '' 'Everyone loses work sometimes.'
commit "Write chapter 1"
mark c
at 2024-03-12T09:00
write chapter2.md '# The idea' '' 'Keep a diary of every move.'
commit "Write chapter 2"
mark d

# 03-14: chapter 2 is thrown away with a hard reset.
at 2024-03-14T10:00
git reset -q --hard HEAD~1

# 03-16: a quick detour to a notes branch and back (HEAD moves, main does not).
at 2024-03-16T09:00
git switch -q -c notes
commit_file notes.md "Research links go here." "Add research notes"
git switch -q main

at 2024-03-18T09:00
write chapter2.md '# The idea' '' 'Write down where you have been, and you can always go back.'
commit "Rewrite chapter 2"
mark e
at 2024-03-20T09:00
write chapter3.md '# The plan' '' 'Teach the diary.'
commit "Add chapter 3"
mark f
