const test = require('node:test');
const assert = require('node:assert');
const { NUMS, winner2D, winner1D, winnerMemo } = require('../assets/predict-winner.js');

// Plain minimax: best difference for the current player
const diff = (a, i = 0, j = a.length - 1) => i > j ? 0 : Math.max(a[i] - diff(a, i + 1, j), a[j] - diff(a, i, j - 1));

test('2D, 1D and memo match minimax', () => {
  const cases = [NUMS, [1, 5, 2], [7], [0, 0], [3, 9, 1, 2]];
  for (let k = 0; k < 50; k++) cases.push(Array.from({ length: 1 + k % 8 }, (_, i) => (k * 13 + i * 29) % 20));
  for (const nums of cases) {
    const want = diff(nums) >= 0;
    assert.strictEqual(winner2D(nums).at(-1).result, want, `2D ${nums}`);
    assert.strictEqual(winner1D(nums).at(-1).result, want, `1D ${nums}`);
    assert.strictEqual(winnerMemo(nums).at(-1).result, want, `memo ${nums}`);
  }
  assert.strictEqual(winner2D([1, 5, 2]).at(-1).result, false);
  assert.strictEqual(winner2D([1, 5, 233, 7]).at(-1).result, true);
});
