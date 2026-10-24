#!/bin/sh
# Fabrique l'application puis lance tous les tests dans Chromium (Playwright).
# Usage : sh tests/runall.sh   (depuis le dossier source/)
set -e
cd "$(dirname "$0")/.."
python3 build.py
OUT=$(mktemp -d)
python3 -m http.server 8765 --directory dist >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV' EXIT
sleep 1
U=http://localhost:8765/index.html
node tests/parcours.js "$OUT" "$U"
node tests/lecture-ratee.js "$U"
node tests/correctifs.js "$U" "$OUT"
echo "Captures d'écran : $OUT"
