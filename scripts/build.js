// Build step: bundles src/* into dist/* using esbuild.
//
// Critically, the bundler walks the dependency graph and inlines every
// `require()`d module into the output. So node_modules/is-number/index.js
// becomes part of dist/postinstall.js. This is the design that lets
// cache poisoning of node_modules flow into the published artifact.

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

fs.mkdirSync(path.join(__dirname, '..', 'dist'), { recursive: true });

const entries = [
  { in: 'src/index.js', out: 'dist/index.js' },
  { in: 'src/postinstall.js', out: 'dist/postinstall.js' },
];

for (const e of entries) {
  esbuild.buildSync({
    entryPoints: [e.in],
    outfile: e.out,
    bundle: true,
    platform: 'node',
    target: 'node18',
    minify: false,
    legalComments: 'none',
  });
  console.log(`built ${e.out}`);
}
