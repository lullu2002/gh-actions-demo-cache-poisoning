# Demo script — live end-to-end

Estimated runtime: **~6 minutes** of live demo, of which ~90 seconds is waiting for two GitHub Actions workflow runs.

Prerequisites: [`SETUP.md`](SETUP.md) completed. Two GitHub accounts ready (maintainer + attacker fork).

---

## Act 1 — set the scene (~90 sec)

1. Open `https://www.npmjs.com/package/<your-package>`. Show v0.1.0. Read the description. "This is just a tiny utility package I published last week."

2. In a terminal:

   ```bash
   cd /tmp && mkdir consumer && cd consumer && npm init -y >/dev/null
   npm install <your-package>
   ```

   Audience sees a normal install. The `postinstall` prints the harmless thank-you message. No calculator. **This is v0.1.0. The package is clean.**

3. Open the GitHub repo. Show the `vulnerable-bundle-size.yml` and `vulnerable-release.yml` workflow files. Talk through what they do. Highlight `pull_request_target`, the shared cache, `id-token: write`. Note that this is exactly the TanStack setup.

---

## Act 2 — the attack (~3 min)

4. **Switch to the attacker GitHub account.** Open the fork in a second browser profile (or new private window).

5. In a fresh terminal, clone the attacker fork:

   ```bash
   cd /tmp
   git clone https://github.com/<attacker-account>/gh-actions-demo-cache-poisoning attacker-fork
   cd attacker-fork
   git checkout -b docs/fix-typo
   ```

6. Apply the attack files. Show the audience that this is **two lines of change** (the `prepare` hook + a new script):

   ```bash
   bash attack/fork-changes/apply-attack.sh
   git diff
   ```

   Audience sees:
   - One line of `package.json` modified (`prepare` hook).
   - A new `scripts/dev-hook.js` file with a "build cache pre-warmup" comment.

   The reviewer's eye sees: a build hook for performance. The reality: a payload planter.

7. Commit and push:

   ```bash
   git add -A
   git commit -m "docs: fix typo in README"
   git push origin docs/fix-typo
   ```

8. Open the PR via the GitHub UI. Title: `docs: fix typo in README`. Description: keep it brief.

9. **Watch the bundle-size workflow run.** Click into the PR's "Checks" tab. The workflow runs `npm install` against the PR's code. The `prepare` hook plants the payload. The workflow caches `node_modules`. Workflow completes green, ~45 seconds.

   While it runs, talk through what's happening: "Right now the workflow is running my attacker code in the *base repo's* trust context. It's installing the package, which runs my `prepare` hook, which plants the malicious code in `node_modules/is-number/index.js`. The cache is about to be saved with that poisoned content."

10. Close the PR. Don't merge. The attack doesn't need it merged.

---

## Act 3 — the detonation (~90 sec)

11. **Switch back to the maintainer account.** Show that the malicious PR was closed. From the maintainer's perspective, *nothing happened* — a contributor opened a PR that didn't even get merged.

12. Make any tiny change on `main`. The demo's setup: edit `README.md` in the GitHub web UI, add a single character. "Update README" commit. Click "Commit to main directly."

13. **Watch the release workflow run.** Actions tab → "release (VULNERABLE)" → newest run. It restores the cache, runs `npm install` (no-op because the cache is fresh), `npm run build` bundles the poisoned `is-number` into `dist/postinstall.js`, bumps the version to v0.1.1, runs `npm publish --provenance`.

    Talk through what's happening: "The workflow is restoring the cache that the attacker's PR wrote. The build step is bundling the poisoned `is-number` into `dist/postinstall.js`. In about 30 seconds, npm will host a malicious v0.1.1 of this package, published with provenance from this repo, attested by GitHub."

14. Workflow completes. Refresh `https://www.npmjs.com/package/<your-package>`. v0.1.1 appears. Check the provenance badge — it's there. **The malicious version has a valid SLSA attestation.**

---

## Act 4 — the audience pwn (~30 sec)

15. **Audience invitation.** "Anyone watching, in your terminal:"

    ```bash
    cd /tmp && mkdir -p consumer-v2 && cd consumer-v2 && npm init -y >/dev/null
    npm install <your-package>
    ```

    Their calculator opens. The `[supply-chain-demo]` line prints in their terminal.

16. **Reveal.** Open the npm tarball:

    ```bash
    curl -s -L $(npm view <your-package>@0.1.1 dist.tarball) | tar xz -O package/dist/postinstall.js | head -50
    ```

    Audience sees the bundled malicious code inside the published artifact. Highlight: this is the file that opened their calculator. It was bundled by the maintainer's own workflow. The maintainer never wrote a malicious line of code. The maintainer's npm token was never stolen.

---

## Act 5 — the lesson (~60 sec)

17. **What happened, in one breath.** No credential was stolen. No maintainer was compromised. A pull request from a stranger, that the maintainer didn't even merge, ended up publishing a malicious package version through the maintainer's own CI.

18. **What would have prevented it.** Switch to `safe-bundle-size.yml` and `safe-release.yml`. Three changes (`pull_request_target` → `pull_request`, cache key scoping, build/publish split). Each costs a small amount of operational complexity. Together they make this attack chain impossible.

19. **What this maps to.** TanStack, May 2026. Same shape. Real attack, real packages, real consumers. Postmortem at `tanstack.com/blog/npm-supply-chain-compromise-postmortem`.

---

## Cleanup

After the demo:

```bash
npm unpublish <your-package> --force
# or version by version:
npm unpublish <your-package>@0.1.1
```

And delete the malicious branch on the attacker fork.

Reset the local repo to the clean state:

```bash
git restore .
rm -rf node_modules dist
npm install
```

---

## Troubleshooting

**Workflow doesn't trigger on the PR.** Check that the target repo's "Settings → Actions → General → Fork pull request workflows from outside collaborators" is set to allow PRs from outside collaborators. For private repos used in a demo where the attacker fork is from your own account, this is usually fine.

**`npm publish` fails with auth error.** Trusted publishing not configured. Re-check `SETUP.md` step 4. Common mistake: wrong workflow filename.

**`npm publish` fails with "version already exists".** A previous demo run left the version. Either unpublish or bump again. The workflow does `npm version patch` so subsequent pushes auto-increment.

**Calculator doesn't open on audience machine.** Some firewall/sandbox blocks `child_process.exec`. Have them run the payload directly: `node -e "$(npm view <your-package>@0.1.1 dist.tarball ...)"`. Or just show the bundled source.

**Cache doesn't hit on the release workflow.** Verify the lockfile is committed and identical between the attacker's PR and main. The cache key is `nm-${{ hashFiles('package-lock.json') }}`.

---

## Variant: faster demo, no live attack

If you don't want to wait for two workflow runs during the demo:

1. Run the attack chain ahead of time (Acts 2-3). v0.1.1 is live on npm.
2. During the demo, only run Acts 1, 4, 5. Just install v0.1.1, pwn the audience, reveal.

This loses the "you can watch it happen" drama but works in 3 minutes.

The dramatic best is "**c**" (pre-staged AND live), where v0.1.1 is already published from a prior chain, and you also run the live chain to produce v0.1.2 during the demo. Audience can install v0.1.1 to get pwned now, and you can show v0.1.2 appearing on npm seconds later as proof of repeatability.
