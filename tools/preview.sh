#!/usr/bin/env bash
# Generate browser-preview data for lessons: tools/preview.sh 2.03 6.08 ...
# Then: pnpm dev and open http://localhost:1420/?lesson=2.03
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/preview
cargo build -q -p canopy-lesson
for id in "$@"; do
  ./target/debug/canopy-lesson preview "$id" > "public/preview/$id.json"
  echo "public/preview/$id.json"
done
