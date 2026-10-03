#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo blog
write index.md "# My blog" "" "Posts live in posts/."
commit "Add blog skeleton"
mark skeleton

write about.md "# About" "" "Notes on programming and bread."
commit "Add about page"
mark main-tip

git switch -q -c drafts
as jordan
write ideas.md "- a post about branches" "- a post about bread"
commit "Draft: ideas list"
mark d1

write posts/01-hello.md "# Hello world" "" "First post."
commit "Add post: Hello world"
mark d2

write posts/02-git-tips.md "# Git tips" "" "Use short commits."
commit "Add post: Git tips"
mark d3

write posts/03-branching.md "# Branching" "" "Branches are cheap."
commit "Add post: Branching"
mark d4

write posts/99-draft.md "# Half-written" "" "TODO"
commit "Draft: half-written post"
mark d5
as alex
git switch -q main
