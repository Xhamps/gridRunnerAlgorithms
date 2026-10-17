const test = require('node:test');
const assert = require('node:assert');
const { stairsArray, stairsVars, stairsMemo } = require('../assets/climbing-stairs.js');

// Independent reference: k two-steps and n-2k one-steps can be ordered in C(n-k, k) ways.
const C = (n, k) => { let r = 1; for (let j = 1; j <= k; j++) r = r * (n - k + j) / j; return Math.round(r); };
const ways = (n) => { let s = 0; for (let k = 0; 2 * k <= n; k++) s += C(n - k, k); return s; };

test('array, vars and memo match the combinatorial count', () => {
  for (let n = 1; n <= 20; n++) {
    const want = ways(n);
    assert.strictEqual(stairsArray(n).at(-1).result, want, `array ${n}`);
    assert.strictEqual(stairsVars(n).at(-1).result, want, `vars ${n}`);
    assert.strictEqual(stairsMemo(n).at(-1).result, want, `memo ${n}`);
  }
  assert.strictEqual(stairsArray().at(-1).result, 8);
});
