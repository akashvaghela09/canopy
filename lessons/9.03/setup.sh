#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo site
write index.html "<h1>Studio</h1>" "<p>Welcome.</p>"
commit "Add index page"
mark index

write styles.css "body { font-family: sans-serif; }"
commit "Add styles"
mark styles

write contact.html "<h1>Contact</h1>" "<p>hello@studio.example</p>" "<link rel=\"stylesheet\" href=\"contact.css\">"
commit "Add contact page"
mark contact

write contact.css "h1 { color: #336; }"
