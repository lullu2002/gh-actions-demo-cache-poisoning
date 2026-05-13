// Runs (in bundled form, as dist/postinstall.js) when a consumer
// installs this package. The legitimate behaviour is to print a
// short message confirming the install — nothing more.
//
// However, dist/postinstall.js is BUILT from this source plus everything
// in node_modules via esbuild. If node_modules has been poisoned by an
// attacker's cache-poisoning PR before the release workflow runs, the
// bundled dist/postinstall.js will contain the attacker's code.

const isNumber = require('is-number');

if (isNumber(42)) {
  console.log('[cache-poisoning-pwn-demo] thanks for installing!');
  console.log('[cache-poisoning-pwn-demo] this is an EDUCATIONAL DEMO package.');
  console.log('[cache-poisoning-pwn-demo] if your calculator just opened, you have witnessed a cache-poisoning supply-chain attack.');
  console.log('[cache-poisoning-pwn-demo] see https://github.com/lullu57/gh-actions-demo-cache-poisoning');
}
