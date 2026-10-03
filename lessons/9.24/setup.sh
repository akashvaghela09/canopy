#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo app
write app.js "console.log('app');"
commit "Add app"
mark fork

git switch -q -c editor
write editor.js "export const editor = { text: '' };"
commit "Add editor"
mark e1
write toolbar.js "export const toolbar = ['bold', 'italic'];"
commit "Add editor toolbar"
mark e2

git switch -q -c editor-undo
as priya
write undo.js "export const history = [];"
commit "Add undo"
mark s1

git switch -q editor
as alex
tick
git merge -q --no-ff editor-undo -m "Merge branch 'editor-undo' into editor"
mark merge
write tests/editor.test.js "test('editor starts empty', () => {});"
commit "Add editor tests"
mark e3

git switch -q main
as sam
write README.md "# app"
commit "Add README"
mark main-tip
as alex
git switch -q editor
