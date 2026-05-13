# One-time setup

You only do this once, when you first set up the demo. After this, the attack chain runs end-to-end on real npm.

## 0. Decide on a package name

The package is published to **public npm**, so the name must be unique globally. Options:

1. **Unscoped**: pick a name like `cache-poisoning-pwn-demo-<random>`. Check availability with `npm view <name>` (returns 404 if free).
2. **Scoped**: `@<your-npm-username>/cache-poisoning-pwn-demo`. Scoped names are unique per scope; you just need to own the scope (i.e. have an npm account with that username).

The current `package.json` uses `cache-poisoning-pwn-demo` unscoped. If that's taken, edit `name` in `package.json` and `package-lock.json` accordingly.

## 1. Create an npm account (if you don't have one)

```bash
npm adduser
```

Follow the email verification. Make sure 2FA is enabled (`npm profile enable-2fa auth-and-writes`).

## 2. Update package metadata

```bash
# Inside this repo:
node -e "
  const fs = require('fs');
  const pkg = require('./package.json');
  pkg.name = 'YOUR-PACKAGE-NAME';          // edit
  pkg.repository.url = 'git+https://github.com/YOUR-USER/gh-actions-demo-cache-poisoning.git';
  pkg.homepage = 'https://github.com/YOUR-USER/gh-actions-demo-cache-poisoning';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"
```

Or just edit by hand.

## 3. Publish the clean baseline (v0.1.0) manually

```bash
npm install            # builds dist/ via prepare hook
npm publish --access public
```

Verify on `https://www.npmjs.com/package/<your-package-name>` — should show v0.1.0.

## 4. Configure npm trusted publishing (OIDC)

This is what lets the GitHub release workflow publish without a static `NPM_TOKEN`.

1. Go to `https://www.npmjs.com/package/<your-package-name>/access`.
2. Scroll to "Trusted Publisher" section.
3. Click "Add trusted publisher".
4. Fill in:
   - **Publisher**: GitHub Actions
   - **Repository**: `<your-user>/gh-actions-demo-cache-poisoning`
   - **Workflow filename**: `vulnerable-release.yml`
   - **Environment**: leave blank (the vulnerable workflow doesn't use environments)
5. Save.

From this point, any workflow run that:
- runs in the configured repo,
- runs the configured workflow file,
- has `id-token: write` permission,
- runs `npm publish --provenance`

…can publish to this package with no static token.

## 5. Push this repo to GitHub

```bash
gh repo create gh-actions-demo-cache-poisoning --private --source=. --push
```

(Or: create privately on GitHub UI, then `git remote add origin ... && git push -u origin main`.)

## 6. (Optional) Set up the attacker fork

For the live demo, you'll want a *different* GitHub account to play the attacker. From that account:

1. Click "Fork" on the published repo.
2. Clone the fork locally.

You'll use this fork during the [DEMO-SCRIPT](DEMO-SCRIPT.md).

## 7. Verify

- `npm install <your-package>` from any directory: prints the "thanks for installing" message; no calculator. v0.1.0 is clean.
- Workflow runs visible in the GitHub Actions tab.

You're ready to run [DEMO-SCRIPT.md](DEMO-SCRIPT.md).

---

## Cleanup after the demo

```bash
npm unpublish <your-package> --force         # while still under 72 hours
# or unpublish specific versions:
npm unpublish <your-package>@0.1.1
```

npm allows unpublish within 72 hours of original publish, OR for packages with no dependents. Plan accordingly.

Also delete or archive the GitHub repo if you don't want it findable.
