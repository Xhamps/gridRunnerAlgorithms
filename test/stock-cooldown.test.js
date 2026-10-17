const test = require('node:test');
const assert = require('node:assert');
const { PRICES, stock2D, stock1D, stockMemo } = require('../assets/stock-cooldown.js');

// Brute force: on each day either do nothing, or buy/sell (selling skips the next day)
const brute = (p, i = 0, holding = false) => {
  if (i >= p.length) return 0;
  const wait = brute(p, i + 1, holding);
  return Math.max(wait, holding ? p[i] + brute(p, i + 2, false) : brute(p, i + 1, true) - p[i]);
};

test('2D, 1D and memo match brute force', () => {
  const cases = [PRICES, [1], [5, 4, 3], [1, 2, 4], [2, 1, 4, 5, 2, 9, 7]];
  for (let k = 0; k < 50; k++) cases.push(Array.from({ length: 1 + k % 10 }, (_, i) => (k * 7 + i * 13) % 11));
  for (const p of cases) {
    const want = brute(p);
    assert.strictEqual(stock2D(p).at(-1).result, want, `2D ${p}`);
    assert.strictEqual(stock1D(p).at(-1).result, want, `1D ${p}`);
    assert.strictEqual(stockMemo(p).at(-1).result, want, `memo ${p}`);
  }
  assert.strictEqual(stock2D([1, 2, 3, 0, 2]).at(-1).result, 3);
  assert.strictEqual(stock2D([1]).at(-1).result, 0);
});
