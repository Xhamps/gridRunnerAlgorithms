const test = require('node:test');
const assert = require('node:assert');
const { RP_NUMS, rpBrute, rpMerge } = require('../assets/reverse-pairs.js');

// Independent reference: count pairs straight from the definition.
const want = (a) => {
  let c = 0;
  a.forEach((x, i) => a.slice(i + 1).forEach((y) => { if (x > 2 * y) c++; }));
  return c;
};

test('forca and merge match the direct count', () => {
  const cases = [RP_NUMS, [], [7], [1, 3, 2, 3, 1], [2, 4, 3, 5, 1], [2, 1], [2, 2, 2], [5, 5, 2, 2],
    [-5, -3, -1], [-1, -1, -1], [0, 0, 0], [2147483647, 2147483647, -2147483648], [6, 5, 4, 3, 2, 1]];
  let seed = 11;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 60; k++) cases.push(Array.from({ length: Math.floor(rnd() * 10) }, () => Math.floor(rnd() * 21) - 10));
  for (const c of cases) {
    assert.strictEqual(rpBrute(c).at(-1).result, want(c), `forca ${c}`);
    const m = rpMerge(c);
    assert.strictEqual(m.at(-1).result, want(c), `merge ${c}`);
    assert.deepStrictEqual(m.at(-1).dp.slice(0, c.length), c.slice().sort((x, y) => x - y), `merge sorts ${c}`);
  }
  assert.strictEqual(rpMerge().at(-1).result, 5);
});
