// cache-poisoning-pwn-demo
//
// Tiny utility wrapping is-number. This module exists so the package
// looks like a real package; the interesting code is in src/postinstall.js
// and the workflows, not here.

const isNumber = require('is-number');

module.exports.isPositiveNumber = (x) => isNumber(x) && x > 0;
module.exports.isNegativeNumber = (x) => isNumber(x) && x < 0;
