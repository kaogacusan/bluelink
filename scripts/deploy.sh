#!/bin/sh
# Builds, ships to bluelinkph.com, and copies your local account to your live account.
set -e
cd "$(dirname "$0")/.."
BUNDLE="${TMPDIR:-/tmp}/bluelink-owner"

npm run build
node server/owner.js export .data "$BUNDLE"
rsync -az --delete dist server shared package.json advo:/opt/bluelink/
rsync -az --delete "$BUNDLE/" advo:/tmp/bluelink-owner/
rm -rf "$BUNDLE"
# The app keeps the database in memory, so stop it while we write, then start it again.
ssh advo 'pm2 stop bluelink >/dev/null && node /opt/bluelink/server/owner.js import /opt/bluelink-data /tmp/bluelink-owner; rm -rf /tmp/bluelink-owner; pm2 start bluelink >/dev/null && echo "Live: https://bluelinkph.com"'
