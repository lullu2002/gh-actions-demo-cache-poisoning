# Fork changes

The exact files an attacker would commit to their fork to execute the cache-poisoning chain end-to-end against this repo.

## Files

| Path on fork | Source here | What it does |
|--------------|-------------|--------------|
| `scripts/dev-hook.js` | [`scripts/dev-hook.js`](scripts/dev-hook.js) | Planter script. Runs during `prepare`. Injects calculator payload into `node_modules/is-number/index.js`. |
| `package.json` | diff in [`package.json.diff`](package.json.diff) | Modify `prepare` to also run `scripts/dev-hook.js`. |

## Quick application

From a clean fork checkout:

```bash
git checkout -b docs/fix-typo
bash /path/to/attack/fork-changes/apply-attack.sh
git add -A
git commit -m "docs: fix typo in README"
git push origin docs/fix-typo
# open the PR
```

## What NOT to do

- **Do not modify `package-lock.json`.** The cache key is derived from it. If the lockfile changes, your poisoned cache won't be restored by the release workflow.
- **Do not modify `dependencies` in `package.json`.** Adding a dep would change the lockfile (see above) and would also be flagged by Dependabot / GitHub's dependency scanning.
- **Do not make the PR title look weird.** The whole point is that the diff looks like a documentation change.
