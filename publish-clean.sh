#!/usr/bin/env bash
# Publish a clean v0.1.0 (or whatever's in package.json) to npm.
#
# Resets node_modules and dist from scratch to guarantee no leftover
# poison from a local attack simulation gets bundled into the published
# artifact.

set -euo pipefail

cd "$(dirname "$0")"

echo "==> Reset working tree to clean state"
rm -rf node_modules dist

echo "==> Reinstall dependencies (this triggers prepare → fresh build)"
npm install

echo "==> Verify dist/postinstall.js is clean"
if grep -q "supply-chain-demo" dist/postinstall.js; then
    echo "FAIL: dist/postinstall.js contains the demo payload. Something is wrong."
    echo "      Inspect node_modules/is-number/index.js — it should not contain"
    echo "      'supply-chain-demo'."
    exit 1
fi
echo "  dist/postinstall.js looks clean."

echo "==> Confirm package.json name"
PKG_NAME=$(node -p "require('./package.json').name")
echo "  Will publish as: $PKG_NAME"
echo "  If that's wrong, edit package.json first."
read -r -p "  Proceed with npm publish? [y/N] " ok
[[ "$ok" == "y" || "$ok" == "Y" ]] || { echo "aborted"; exit 1; }

echo "==> npm publish"
npm publish --access public

echo
echo "Done. Verify at https://www.npmjs.com/package/$PKG_NAME"
