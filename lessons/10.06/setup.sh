#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo blog
at 2024-04-22T09:00
commit_file README.md "# blog" "Add README"
at 2024-04-22T11:00
write posts/hello.md '# Hello' 'First post.'
commit "Add first post"
at 2024-04-22T14:00
write posts/about.md '# About' 'Who writes here.'
commit "Add about page"
mark main-tip

git switch -q -c feature/comments
at 2024-04-23T09:00
write comments.py 'def add_comment(post, text):' '    post.comments.append(text)'
commit "Add comment model"
at 2024-04-23T11:00
commit_file templates/comments.html "<ul class=comments></ul>" "Render comments"
mark comments-tip

git switch -q -c feature/drafts main
at 2024-04-24T09:00
commit_file drafts.py 'DRAFTS = {}' "Add draft storage"
at 2024-04-24T11:00
write drafts.py 'DRAFTS = {}' '' 'def save_draft(slug, body):' '    DRAFTS[slug] = body'
commit "Save drafts by slug"
at 2024-04-24T15:00
write drafts.py 'DRAFTS = {}' 'AUTOSAVE_SECONDS = 30' '' 'def save_draft(slug, body):' '    DRAFTS[slug] = body'
commit "Add draft autosave"
mark drafts-tip

git switch -q main
at 2024-04-25T09:00
git branch -q -D feature/drafts
