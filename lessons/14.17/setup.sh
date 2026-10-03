#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo site
at 2024-09-01T08:00
write index.html "<h1>Allotment society</h1>"
write about.html "<p>Founded in 1952.</p>"
write style.css "body { color: #222; }"
commit "Add site skeleton"
write style.css "body { color: #222; background: #fafafa; }"
commit "Add page background"
mark tip

# index.html: changed and staged. about.html: changed, not staged.
write index.html "<h1>Allotment society</h1>" "<p>Plots, tools and advice.</p>"
git add index.html
write about.html "<p>Founded in 1952 by twelve neighbours.</p>"
