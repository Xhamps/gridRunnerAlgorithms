const test = require('node:test');
const assert = require('node:assert');
const { SG3_VALS, sg3Array, sg3Vars, sg3Memo } = require('../assets/stone-game-3.js');

// Plain minimax over whole games: each player maximizes own total minus the rival's.
const diff = (a, i = 0) => {
  if (i >= a.length) return 0;
  let best = -Infinity, sum = 0;
  for (let k = 1; k <= 3 && i + k <= a.length; k++) { sum += a[i + k - 1]; best = Math.max(best, sum - diff(a, i + k)); }
  return best;
};
const winner = (a) => { const d = diff(a); return d > 0 ? 'Alice' : d < 0 ? 'Bob' : 'Tie'; };

test('array, vars and memo match minimax', () => {
  const cases = [SG3_VALS, [1, 2, 3, -9], [1, 2, 3, 6], [5], [-1], [0], [-1, -2, -3], [1, 2, 3, -1, -2, -3, 7], [-2, 10, -3]];
  for (let k = 0; k < 60; k++) cases.push(Array.from({ length: 1 + k % 9 }, (_, i) => ((k * 17 + i * 31) % 21) - 10));
  for (const a of cases) {
    const want = winner(a);
    assert.strictEqual(sg3Array(a).at(-1).result, want, `array ${a}`);
    assert.strictEqual(sg3Vars(a).at(-1).result, want, `vars ${a}`);
    assert.strictEqual(sg3Memo(a).at(-1).result, want, `memo ${a}`);
  }
  assert.strictEqual(winner([1, 2, 3, 7]), 'Bob');
  assert.strictEqual(winner([1, 2, 3, -9]), 'Alice');
  assert.strictEqual(winner([1, 2, 3, 6]), 'Tie');
});
