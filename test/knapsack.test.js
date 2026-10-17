const test = require('node:test');
const assert = require('node:assert');
const { ITEMS, CAP, steps2D, steps1D, stepsMemo } = require('../assets/knapsack.js');

// Brute force over every subset
const brute = (items, W) => {
  let best = 0;
  for (let m = 0; m < 1 << items.length; m++) {
    let w = 0, v = 0;
    items.forEach((it, i) => { if (m >> i & 1) { w += it.w; v += it.v; } });
    if (w <= W) best = Math.max(best, v);
  }
  return best;
};

test('2D, 1D and memo match brute force', () => {
  const cases = [[ITEMS, CAP]];
  for (let k = 0; k < 50; k++) {
    const items = Array.from({ length: 1 + k % 6 }, (_, i) => ({ name: 'x' + i, w: 1 + (k * 7 + i * 3) % 6, v: 1 + (k * 5 + i * 11) % 9 }));
    cases.push([items, k % 10]);
  }
  for (const [items, W] of cases) {
    const want = brute(items, W);
    assert.strictEqual(steps2D(items, W).at(-1).dp.at(-1), want);
    assert.strictEqual(steps1D(items, W).at(-1).dp.at(-1), want);
    assert.strictEqual(stepsMemo(items, W).at(-1).result, want);
  }
});
