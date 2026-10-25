const test = require('node:test');
const assert = require('node:assert');
const { SG2_PILES, sg2Matrix, sg2Memo } = require('../assets/stone-game-2.js');

// Plain minimax over whole games: Alice maximizes her total, Bob minimizes it. No memo, no suffix sums.
function alice(p, i = 0, M = 1, aliceTurn = true) {
  if (i >= p.length) return 0;
  let best = aliceTurn ? -Infinity : Infinity, got = 0;
  for (let X = 1; X <= 2 * M && i + X <= p.length; X++) {
    got += p[i + X - 1];
    const r = alice(p, i + X, Math.max(M, X), !aliceTurn) + (aliceTurn ? got : 0);
    best = aliceTurn ? Math.max(best, r) : Math.min(best, r);
  }
  return best;
}

test('matriz and memo match plain minimax', () => {
  const cases = [SG2_PILES, [2, 7, 9, 4, 4], [1, 2, 3, 4, 5, 100], [5], [1, 1], [10, 1, 1], [1, 1, 1, 1, 50]];
  for (let k = 0; k < 60; k++) cases.push(Array.from({ length: 1 + k % 9 }, (_, i) => 1 + (k * 17 + i * 31) % 23));
  for (const p of cases) {
    const want = alice(p);
    assert.strictEqual(sg2Matrix(p).at(-1).result, want, `matriz ${p}`);
    assert.strictEqual(sg2Memo(p).at(-1).result, want, `memo ${p}`);
  }
  assert.strictEqual(alice([2, 7, 9, 4, 4]), 10);
  assert.strictEqual(alice([1, 2, 3, 4, 5, 100]), 104);
  assert.strictEqual(alice(SG2_PILES), 18);
  assert.ok(sg2Memo().at(-1).hits > 0, 'memo sample needs cache hits');
});
