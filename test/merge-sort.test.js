const test = require('node:test');
const assert = require('node:assert');
const { MS_NUMS, msRecursive, msIterative } = require('../assets/merge-sort.js');

// Independent reference: the built-in numeric sort.
const want = (a) => [...a].sort((x, y) => x - y);

test('recursivo and iterativo match the built-in sort', () => {
  const cases = [MS_NUMS, [], [7], [2, 1], [3, -1, 3, 0], [1, 1, 1], [5, 4, 3, 2, 1], [1, 2, 3, 4, 5, 6, 7], [-5, 0, -5, 10, -20]];
  let seed = 11;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 60; k++) cases.push(Array.from({ length: Math.floor(rnd() * 13) }, () => Math.floor(rnd() * 21) - 10));
  for (const c of cases) {
    assert.deepStrictEqual(msRecursive(c).at(-1).result, want(c), `recursivo ${c}`);
    assert.deepStrictEqual(msIterative(c).at(-1).result, want(c), `iterativo ${c}`);
  }
  assert.deepStrictEqual(msRecursive().at(-1).result, [1, 2, 3, 4, 5, 6]);
});
