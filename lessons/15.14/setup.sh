#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
at 2024-11-20T09:00
write index.html "<body>" "<!-- content -->" "</body>"
write theme.css "body { margin: 0; }"
commit "Start the page"
mark base

git checkout -q -b header
as sam
write header.html "<header>Welcome</header>"
write theme.css "body { margin: 0; }" "header { background: navy; color: white; }"
commit "Add a header"
mark header

git checkout -q main
git checkout -q -b footer
as priya
write footer.html "<footer>Contact us</footer>"
commit "Add a footer"
mark footer

git checkout -q main
git checkout -q -b sidebar
as jordan
write sidebar.html "<aside>Links</aside>"
commit "Add a sidebar"
mark sidebar

git checkout -q main
git checkout -q -b clash
as sam
write theme.css "body { margin: 0; }" "header { background: darkgreen; color: white; }"
commit "Try a green header"
mark clash

as alex
git checkout -q main
write index.html "<body>" "<!-- content -->" "<p>Opening hours: 9 to 5.</p>" "</body>"
commit "Add opening hours to the page"
mark main-tip
