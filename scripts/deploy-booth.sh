#!/bin/sh
# Ships the booth site to bluelinkph.com/boothrender/.
# The booth files use paths from the site root (/assets, /render), so we point them at /boothrender/ first.
set -e
cd "$(dirname "$0")/../boothrender"
OUT="${TMPDIR:-/tmp}/bluelink-booth"

rm -rf "$OUT" && mkdir -p "$OUT"
rsync -a --exclude '.DS_Store' index.html booth.js render kit assets "$OUT/"
find "$OUT" -type f \( -name '*.html' -o -name '*.js' -o -name '*.css' -o -name '*.json' \) -not -path "$OUT/assets/vendor/*" -print0 \
  | xargs -0 perl -pi -e 's#(["'"'"'`(])/(assets|render|kit|booth\.js)#$1/boothrender/$2#g; s#href="/"#href="/boothrender/"#g'
rsync -az --delete "$OUT/" advo:/opt/bluelink-booth/
rm -rf "$OUT"
echo "Live: https://bluelinkph.com/boothrender/"
