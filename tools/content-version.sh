#!/usr/bin/env bash
# The lesson content version, derived from git so the app build and the
# published pack built from the same lessons always agree:
#   <UTC date of the last commit touching lessons/>.<commits touching lessons/>
# e.g. 2026.10.04.31. Needs full history (fetch-depth: 0 in CI).
# src-tauri/build.rs computes the same value; keep them in sync.
set -euo pipefail
cd "$(dirname "$0")/.."
d=$(TZ=UTC git log -1 --date=format-local:%Y.%m.%d --format=%cd -- lessons)
n=$(git rev-list --count HEAD -- lessons)
echo "$d.$n"
