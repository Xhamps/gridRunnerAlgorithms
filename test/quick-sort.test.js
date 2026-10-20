const test = require('node:test');
const assert = require('node:assert');
const { QS_NUMS, qsLomuto, qsHoare } = require('../assets/quick-sort.js');

// Independent reference: the built-in numeric sort.
const want = (a) => [...a].sort((x, y) => x - y);

test('lomuto and hoare match the built-in sort', () => {
  const cases = [QS_NUMS, [], [7], [2, 1], [0, -7, 0, 9], [3, 3, 3, 3], [5, 4, 3, 2, 1], [1, 2, 3, 4, 5, 6, 7], [-5, 0, -5, 10, -20]];
  let seed = 23;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 60; k++) cases.push(Array.from({ length: Math.floor(rnd() * 13) }, () => Math.floor(rnd() * 21) - 10));
  for (const c of cases) {
    const before = c.slice();
    assert.deepStrictEqual(qsLomuto(c).at(-1).result, want(c), `lomuto ${c}`);
    assert.deepStrictEqual(qsHoare(c).at(-1).result, want(c), `hoare ${c}`);
    assert.deepStrictEqual(c, before, 'input array is not mutated');
  }
  assert.deepStrictEqual(qsLomuto().at(-1).result, [1, 2, 3, 3, 4, 5]);
});
