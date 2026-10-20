const test = require('node:test');
const assert = require('node:assert');
const { SA_NUMS, SA_K, saBinary, saDP } = require('../assets/split-array.js');

// Independent reference: try every way to place k - 1 cuts among the n - 1 gaps.
function brute(a, k) {
  let best = Infinity;
  const go = (start, left, worst) => {
    if (left === 1) { best = Math.min(best, Math.max(worst, a.slice(start).reduce((x, y) => x + y, 0))); return; }
    let s = 0;
    for (let end = start; end <= a.length - left; end++) { s += a[end]; go(end + 1, left - 1, Math.max(worst, s)); }
  };
  go(0, k, 0);
  return best;
}

test('binaria and matriz match brute force', () => {
  const cases = [[SA_NUMS, SA_K], [[1, 2, 3, 4, 5], 2], [[1, 4, 4], 3], [[5], 1], [[0, 0, 0], 2], [[3, 1], 1], [[2, 9, 1], 3]];
  let seed = 11;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let t = 0; t < 60; t++) {
    const a = Array.from({ length: 1 + Math.floor(rnd() * 7) }, () => Math.floor(rnd() * 12));
    cases.push([a, 1 + Math.floor(rnd() * a.length)]);
  }
  for (const [a, k] of cases) {
    const want = brute(a, k);
    assert.strictEqual(saBinary(a, k).at(-1).result, want, `binaria ${a} k=${k}`);
    assert.strictEqual(saDP(a, k).at(-1).result, want, `matriz ${a} k=${k}`);
  }
  assert.strictEqual(saBinary().at(-1).result, 18);
});
