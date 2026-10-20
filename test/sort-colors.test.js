const test = require('node:test');
const assert = require('node:assert');
const { SC_NUMS, scTwoPass, scDutch } = require('../assets/sort-colors.js');

// Independent reference: count each color and rebuild.
const want = (a) => [0, 1, 2].flatMap((c) => Array(a.filter((x) => x === c).length).fill(c));

test('duas and bandeira match the counting answer', () => {
  const cases = [SC_NUMS, [], [0], [2], [1, 1, 1], [2, 2, 2, 2], [0, 0], [2, 1, 0], [0, 1, 2], [2, 0, 1, 2, 0]];
  let seed = 11;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 60; k++) cases.push(Array.from({ length: Math.floor(rnd() * 12) }, () => Math.floor(rnd() * 3)));
  for (const c of cases) {
    assert.deepStrictEqual(want(c), [...c].sort((x, y) => x - y));
    assert.deepStrictEqual(scTwoPass(c).at(-1).result, want(c), `duas ${c}`);
    assert.deepStrictEqual(scDutch(c).at(-1).result, want(c), `bandeira ${c}`);
  }
  assert.deepStrictEqual(scDutch().at(-1).result, [0, 0, 1, 1, 1, 2, 2]);
});
