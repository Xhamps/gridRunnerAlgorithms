const test = require('node:test');
const assert = require('node:assert');
const { SL_VALS, slRecursive, slIterative } = require('../assets/sort-list.js');

test('recursivo and iterativo match Array.sort and only relink the original nodes', () => {
  const cases = [SL_VALS, [], [7], [2, 1], [1, 2], [3, 3, 3], [2, 1, 2, 1], [5, 4, 3, 2, 1], [-1, 0, -1, 8]];
  let seed = 11;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 60; k++) cases.push(Array.from({ length: Math.floor(rnd() * 12) }, () => Math.floor(rnd() * 11) - 5));
  for (const c of cases) {
    const want = c.slice().sort((x, y) => x - y);
    for (const [name, gen] of [['recursivo', slRecursive], ['iterativo', slIterative]]) {
      const last = gen(c).at(-1);
      assert.deepStrictEqual(last.result, want, `${name} ${c}`);
      // same nodes, each once: order is a permutation of 0..n-1 and node k still holds c[k]
      assert.deepStrictEqual(last.order.slice().sort((x, y) => x - y), c.map((_, k) => k), `${name} order ${c}`);
      assert.deepStrictEqual(last.order.map((k) => c[k]), want);
      c.forEach((v, k) => assert.strictEqual(last.dp[2 * k], v, `${name} val moved ${c}`));
    }
  }
});
