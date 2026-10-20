const test = require('node:test');
const assert = require('node:assert');
const { KL_NUMS, KL_K, klQuick, klHeap } = require('../assets/kth-largest.js');

// Independent reference: sort descending and take position k - 1.
const want = (a, k) => [...a].sort((x, y) => y - x)[k - 1];

test('quickselect and min-heap match sort-desc[k-1]', () => {
  const cases = [[KL_NUMS, KL_K], [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], [[2, 2, 2], 2], [[7], 1], [[4, 1, 9], 1], [[4, 1, 9], 3],
    [[-1, -5, 0, -3], 2], [[-2, -2, -7], 3], [[5, 4, 3, 2, 1], 5], [[1, 2, 3, 4, 5], 1]];
  let seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let t = 0; t < 60; t++) {
    const a = Array.from({ length: 1 + Math.floor(rnd() * 12) }, () => Math.floor(rnd() * 21) - 10);
    cases.push([a, 1 + Math.floor(rnd() * a.length)]);
  }
  for (const [a, k] of cases) {
    assert.strictEqual(klQuick(a, k).at(-1).result, want(a, k), `quickselect ${a} k=${k}`);
    assert.strictEqual(klHeap(a, k).at(-1).result, want(a, k), `heap ${a} k=${k}`);
  }
  assert.strictEqual(klQuick().at(-1).result, 7);
  assert.ok(klQuick().length <= 220 && klHeap().length <= 220);
});
