const test = require('node:test');
const assert = require('node:assert');
const { MLL_A, MLL_B, mllHeap, mllIter, mllRec } = require('../assets/merge-lists.js');

// Independent reference: concat + sort.
const want = (a, b) => [...a, ...b].sort((x, y) => x - y);

test('iterativo and recursivo match concat + sort, reusing the original nodes', () => {
  const cases = [[MLL_A, MLL_B], [[], []], [[], [0]], [[5], []], [[1, 2, 3], [4, 5]], [[4, 5], [1, 2, 3]], [[2, 2], [2]]];
  let seed = 11;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const list = () => Array.from({ length: Math.floor(rnd() * 6) }, () => Math.floor(rnd() * 21) - 10).sort((x, y) => x - y);
  for (let k = 0; k < 60; k++) cases.push([list(), list()]);
  for (const [a, b] of cases) {
    for (const [name, gen, dummy] of [['iterativo', mllIter, true], ['recursivo', mllRec, false]]) {
      const steps = gen(a, b), last = steps.at(-1);
      assert.deepStrictEqual(last.result, want(a, b), `${name} ${a} | ${b}`);
      // Relinking: the result walks exactly the original list nodes (no dummy, no new nodes), with untouched values.
      const { nodes } = mllHeap(a, b, dummy);
      const ids = nodes.map((n, k) => k).filter((k) => nodes[k].name !== 'dummy');
      assert.deepStrictEqual([...last.order].sort((x, y) => x - y), ids, `${name} order ${a} | ${b}`);
      assert.strictEqual(last.nodes.length, nodes.length, `${name}: no node allocated mid-run`);
      last.order.forEach((k) => assert.strictEqual(last.nodes[k].val, nodes[k].val));
    }
  }
  assert.deepStrictEqual(mllIter().at(-1).result, [1, 2, 3, 3, 6, 7, 9]);
});
