#!/usr/bin/env bash
# Build a lesson pack for content updates (docs/CONTENT_UPDATES.md).
#
#   tools/package-lessons.sh <out-dir> <pack-base-url> [changelog-file]
#
# Produces <out-dir>/canopy-lessons-<version>.tar.gz and latest.json.
# Signing is a separate step (CI): minisign -S -m <pack> writes <pack>.minisig.
set -euo pipefail
cd "$(dirname "$0")/.."
out=${1:?out dir}
base=${2:?base url}
changelog=${3:-}
version=$(sed -n 's/^contentVersion: *"\{0,1\}\([^"]*\)"\{0,1\}$/\1/p' lessons/manifest.yaml)
format=$(sed -n 's/^formatVersion: *\([0-9]*\)$/\1/p' lessons/manifest.yaml)
[ -n "$version" ] && [ -n "$format" ] || { echo "cannot read lessons/manifest.yaml" >&2; exit 1; }

cargo build -q -p canopy-lesson
./target/debug/canopy-lesson validate >/dev/null || { echo "lessons do not validate" >&2; exit 1; }

mkdir -p "$out"
pack="canopy-lessons-$version.tar.gz"
# Reproducible-ish archive: sorted, fixed owner and mtime; notes and reviews excluded.
tar --sort=name --owner=0 --group=0 --numeric-owner --mtime='2024-01-01 00:00Z' \
  --exclude='lessons/_notes' --exclude='lessons/_reviews' \
  -czf "$out/$pack" lessons
sha=$(sha256sum "$out/$pack" | cut -d' ' -f1)
size=$(stat -c %s "$out/$pack")
notes=""
[ -n "$changelog" ] && notes=$(cat "$changelog")
python3 - "$out/latest.json" <<PY
import json, sys
json.dump({
  "contentVersion": "$version",
  "formatVersion": int("$format"),
  "url": "$base/$pack",
  "sha256": "$sha",
  "size": int("$size"),
  "changelog": """$notes""",
}, open(sys.argv[1], "w"), indent=2)
PY
echo "$out/$pack ($size bytes, sha256 $sha)"
