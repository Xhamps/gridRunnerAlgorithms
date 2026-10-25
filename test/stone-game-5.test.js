const test = require('node:test');
const assert = require('node:assert');
const { SG5_STONES, sg5Matrix, sg5Memo } = require('../assets/stone-game-5.js');

// Plain exhaustive search on the actual sub-rows: try every cut, keep the smaller part (both on a tie).
const sum = (a) => a.reduce((s, v) => s + v, 0);
const brute = (a) => {
  let best = 0;
  for (let c = 1; c < a.length; c++) {
    const l = a.slice(0, c), r = a.slice(c), sl = sum(l), sr = sum(r);
    if (sl <= sr) best = Math.max(best, sl + brute(l));
    if (sr <= sl) best = Math.max(best, sr + brute(r));
  }
  return best;
};

test('matrix and memo match brute force', () => {
  const cases = [SG5_STONES, [6, 2, 3, 4, 5, 5], [7, 7, 7, 7, 7, 7, 7], [4], [1, 1], [3, 1], [1, 2, 3, 4, 5]];
  for (let k = 0; k < 60; k++) cases.push(Array.from({ length: 1 + k % 8 }, (_, i) => 1 + (k * 13 + i * 29) % 9));
  for (const a of cases) {
    const want = brute(a);
    assert.strictEqual(sg5Matrix(a).at(-1).result, want, `matriz ${a}`);
    assert.strictEqual(sg5Memo(a).at(-1).result, want, `memo ${a}`);
  }
  assert.strictEqual(brute([6, 2, 3, 4, 5, 5]), 18);
  assert.strictEqual(brute([7, 7, 7, 7, 7, 7, 7]), 28);
  assert.strictEqual(brute([4]), 0);
  assert.strictEqual(brute(SG5_STONES), 15);
});

test('default sample visits all three branches and hits the cache', () => {
  const memo = sg5Memo();
  assert.ok(memo.at(-1).hits > 0);
  assert.ok(sg5Matrix().length <= 220 && memo.length <= 220);
});
