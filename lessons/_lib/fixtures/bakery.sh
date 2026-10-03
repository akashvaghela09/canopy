# Shared fixture for section 3: the "Sunrise Bakery" website.
# Source this AFTER setup-lib.sh. It builds $LESSON_ROOT/bakery and leaves
# the shell inside it, on main, with a clean working tree.
#
# Deterministic: fixed authors and dates, so every mark below has the same
# hash for every learner.
#
# Shape (newest first, first-parent order on main):
#   newsletter  Alex    2024-03-27  Add newsletter signup to index      <- HEAD, main
#   gluten      Sam     2024-03-25  Add gluten-free note to menu
#   prices      Jordan  2024-03-22  Raise prices for spring            (baguette 4.00 -> 40.0 by mistake)
#   merge       Alex    2024-03-20  Merge branch 'seasonal-menu'       <- tag v1.0 (annotated)
#     seasonal-2 Sam    2024-03-19  Add spiced latte                   <- branch seasonal-menu
#     seasonal-1 Sam    2024-03-18  Add pumpkin loaf for autumn
#   reformat    Jordan  2024-03-18  Reformat stylesheet                (whitespace only)
#   contact     Alex    2024-03-15  Add contact page
#   rename      Priya   2024-03-13  Move menu into pages folder        (menu.md -> pages/menu.md)
#   typo        Jordan  2024-03-12  Fix typo in README
#   croissant   Sam     2024-03-08  Add croissant to menu              <- tag v0.1 (annotated)
#   hours       Priya   2024-03-06  Add opening hours to index
#   styles      Alex    2024-03-05  Add stylesheet
#   menu-added  Sam     2024-03-04  Add menu page
#   first       Alex    2024-03-04  Add README and site skeleton
#   dark        Priya   2024-03-26  Add dark theme variables           <- branch dark-mode (unmerged, off gluten)

new_repo bakery

as alex
at 2024-03-04T08:00
write README.md "# Sunrise Bakery website" "" "A small static site for the bakery on Elm Steet."
write index.html "<h1>Sunrise Bakery</h1>" "<p>Fresh bread every morning.</p>"
commit "Add README and site skeleton"
mark first

as sam
at 2024-03-04T13:00
write menu.md "# Menu" "" "- Sourdough loaf 6.00" "- Baguette 4.00"
commit "Add menu page"
mark menu-added

as alex
at 2024-03-05T10:00
write styles.css "body {font-family:Georgia,serif;}" "h1 {color:#8b4513;}"
commit "Add stylesheet"
mark styles

as priya
at 2024-03-06T11:00
append index.html "<h2>Opening hours</h2>" "<p>Open 7am to 2pm, Tuesday to Sunday.</p>"
commit "Add opening hours to index"
mark hours

as sam
at 2024-03-08T10:00
append menu.md "- Croissant 3.50"
commit "Add croissant to menu"
mark croissant
tick
git tag -a v0.1 -m "First draft of the site"

as jordan
at 2024-03-12T11:00
write README.md "# Sunrise Bakery website" "" "A small static site for the bakery on Elm Street."
commit "Fix typo in README"
mark typo

as priya
at 2024-03-13T11:00
mkdir -p pages
git mv menu.md pages/menu.md
commit "Move menu into pages folder"
mark rename

as alex
at 2024-03-15T11:00
write pages/contact.md "# Contact" "" "Email hello@sunrise-bakery.example"
commit "Add contact page"
mark contact

# Seasonal menu branch (Sam), merged later by Alex.
git branch seasonal-menu
git checkout -q seasonal-menu
as sam
at 2024-03-18T09:00
append pages/menu.md "- Pumpkin loaf 5.50 (autumn only)"
commit "Add pumpkin loaf for autumn"
mark seasonal-1
at 2024-03-19T10:00
append pages/menu.md "- Spiced latte 3.00"
commit "Add spiced latte"
mark seasonal-2

git checkout -q main
as jordan
at 2024-03-18T13:00
write styles.css "body { font-family: Georgia, serif; }" "h1 { color: #8b4513; }"
commit "Reformat stylesheet"
mark reformat

as alex
at 2024-03-20T11:00
tick
git merge -q --no-ff seasonal-menu -m "Merge branch 'seasonal-menu'"
mark merge
tick
git tag -a v1.0 -m "Site launch"

as jordan
at 2024-03-22T11:00
write pages/menu.md "# Menu" "" "- Sourdough loaf 6.50" "- Baguette 40.0" "- Croissant 3.80" "- Pumpkin loaf 5.50 (autumn only)" "- Spiced latte 3.00"
commit "Raise prices for spring"
mark prices

as sam
at 2024-03-25T11:00
append pages/menu.md "" "All breads can be made gluten-free on request."
commit "Add gluten-free note to menu"
mark gluten

# Unmerged branch (Priya) so the graph has a second tip.
git branch dark-mode
git checkout -q dark-mode
as priya
at 2024-03-26T11:00
append styles.css ":root { --bg: #1b1b1b; --fg: #f3f3f3; }"
commit "Add dark theme variables"
mark dark

git checkout -q main
as alex
at 2024-03-27T11:00
append index.html "<h2>Newsletter</h2>" "<p>Join our newsletter for weekly specials.</p>" "<form><input type=\"email\"><button>Sign up</button></form>"
commit "Add newsletter signup to index"
mark newsletter

as alex
