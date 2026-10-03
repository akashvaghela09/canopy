#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo site
write index.html \
  "<!doctype html>" \
  "<html>" \
  "<head>" \
  "  <title>Studio</title>" \
  "</head>" \
  "<body>" \
  "<header>" \
  "  <h1>Studio</h1>" \
  "  <nav><a href=\"/\">Home</a> <a href=\"/work\">Work</a></nav>" \
  "</header>" \
  "<main>" \
  "  <p>We design small, fast websites.</p>" \
  "  <p>Based in Leeds, working everywhere.</p>" \
  "  <p>Say hello: hello@studio.example</p>" \
  "</main>" \
  "<footer>" \
  "  <p>Studio, 2023</p>" \
  "</footer>" \
  "</body>" \
  "</html>"
commit "Add index page"
mark base

write index.html \
  "<!doctype html>" \
  "<html>" \
  "<head>" \
  "  <title>Studio</title>" \
  "</head>" \
  "<body>" \
  "<header>" \
  "  <h1>Studio</h1>" \
  "  <nav><a href=\"/\">Home</a> <a href=\"/work\">Work</a></nav>" \
  "  <input type=\"search\" placeholder=\"Search\">" \
  "</header>" \
  "<main>" \
  "  <p>We design small, fast websites.</p>" \
  "  <p>Based in Leeds, working everywhere.</p>" \
  "  <p>Say hello: hello@studio.example</p>" \
  "</main>" \
  "<footer>" \
  "  <p>Studio, 2024</p>" \
  "</footer>" \
  "</body>" \
  "</html>"
commit "Add search box and fix footer year"
mark big

write about.html "<h1>About</h1>" "<p>Two people, one studio.</p>"
commit "Add about page"
mark c3
