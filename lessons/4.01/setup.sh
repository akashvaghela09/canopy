#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo notes
write notes.txt "# Meeting notes" "" "- Launch moved to Friday" "- Priya owns the release checklist"
write todo.txt "# Todo" "" "- Send the agenda"
commit "Add meeting notes and todo list"
mark base

# Good edit in todo.txt, junk pasted into notes.txt.
append todo.txt "- Book the venue"
write notes.txt "# Meeting notes" "" "- Launch moved to Friday" "- Priya owns the release checklist" "asdkjh asdkjh 2938 ((( lorem ipsum" "<<<< pasted by mistake >>>>" "zzzzzzzzzzzzzzzzzzzz"
