#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo blog
write post.md "# Why we switched to git" "" "Draft 1."
write draft.md "# Next post" "" "(empty)"
commit "Add first post and a placeholder draft"
mark base

append post.md "" "We used to email zip files around. It did not go well."
write draft.md "# Next post" "" "Rough idea: compare three editors. Not finished."
git add post.md draft.md
