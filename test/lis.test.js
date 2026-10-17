const test = require('node:test');
const assert = require('node:assert');
const { SEQ, lis2D, lis1D, lisMemo, lisBinary } = require('../assets/lis.js');

// Brute force: try every subset (bitmask) and keep the longest strictly increasing one
const brute = (a) => {
  let best = 0;
  for (let m = 0; m < 1 << a.length; m++) {
    const sub = a.filter((_, i) => m >> i & 1);
    if (sub.every((x, i) => !i || sub[i - 1] < x)) best = Math.max(best, sub.length);
  }
  return best;
};

test('2D, 1D, memo and binary search match brute force', () => {
  const cases = [SEQ, [10, 9, 2, 5, 3, 7, 101, 18], [7, 7, 7], [1], [5, 4, 3, 2, 1], [1, 2, 3, 4]];
  for (let k = 0; k < 80; k++) cases.push(Array.from({ length: 1 + k % 9 }, (_, i) => (k * 7 + i * 13) % 10));
  for (const a of cases) {
    const want = brute(a);
    for (const gen of [lis2D, lis1D, lisMemo, lisBinary]) assert.strictEqual(gen(a).at(-1).result, want, `${gen.name} ${a}`);
  }
  assert.strictEqual(lis1D(SEQ).at(-1).result, 4);
});
