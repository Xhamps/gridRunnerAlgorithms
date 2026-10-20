const test = require('node:test');
const assert = require('node:assert');
const { FL_NUMS, FL_T, flExpand, flBounds } = require('../assets/first-last.js');

// Independent reference: linear scan.
const want = (a, t) => [a.indexOf(t), a.lastIndexOf(t)];

test('expande and fronteiras match a linear scan', () => {
  const cases = [[FL_NUMS, FL_T], [FL_NUMS, 6], [[], 0], [[5], 5], [[5], 4], [[7, 7, 7, 7], 7],
    [[1, 2, 3], 0], [[1, 2, 3], 4], [[1, 1, 2, 2], 1], [[1, 1, 2, 2], 2], [[-3, -3, 0, 4], -3]];
  let seed = 11;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 60; k++) {
    const a = Array.from({ length: Math.floor(rnd() * 12) }, () => Math.floor(rnd() * 9) - 4).sort((x, y) => x - y);
    cases.push([a, Math.floor(rnd() * 11) - 5]);
  }
  for (const [a, t] of cases) {
    assert.deepStrictEqual(flExpand(a, t).at(-1).result, want(a, t), `expande ${a} / ${t}`);
    assert.deepStrictEqual(flBounds(a, t).at(-1).result, want(a, t), `fronteiras ${a} / ${t}`);
  }
  assert.deepStrictEqual(flExpand().at(-1).result, [4, 6]);
});
