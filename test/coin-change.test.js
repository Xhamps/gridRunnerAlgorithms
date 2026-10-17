const test = require('node:test');
const assert = require('node:assert');
const { COINS, AMOUNT, coin2D, coin1D, coinMemo } = require('../assets/coin-change.js');

// Brute force: try every coin as the next one, no cache
const brute = (coins, a) => {
  if (a === 0) return 0;
  let best = Infinity;
  for (const c of coins) if (c <= a) best = Math.min(best, brute(coins, a - c) + 1);
  return best;
};

test('2D, 1D and memo match brute force', () => {
  const cases = [[COINS, AMOUNT], [[2], 3], [[1], 0], [[5, 2], 1], [[2, 5, 10], 13]];
  for (let k = 0; k < 50; k++) {
    const coins = [...new Set(Array.from({ length: 1 + k % 4 }, (_, i) => 2 + (k * 7 + i * 5) % 7))];
    cases.push([coins, k % 15]);
  }
  for (const [coins, A] of cases) {
    const b = brute(coins, A), want = b === Infinity ? -1 : b;
    assert.strictEqual(coin2D(coins, A).at(-1).result, want, `2D ${coins} ${A}`);
    assert.strictEqual(coin1D(coins, A).at(-1).result, want, `1D ${coins} ${A}`);
    assert.strictEqual(coinMemo(coins, A).at(-1).result, want, `memo ${coins} ${A}`);
  }
  assert.strictEqual(coin2D(COINS, AMOUNT).at(-1).result, 2);
});
