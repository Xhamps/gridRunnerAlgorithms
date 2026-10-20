const test = require('node:test');
const assert = require('node:assert');
const { MZ_NUMS, mzBubble, mzPointers } = require('../assets/move-zeroes.js');

// Independent reference: keep the non-zeros in order, pad with zeros.
const want = (a) => [...a.filter((x) => x !== 0), ...a.filter((x) => x === 0)];

test('bolha and ponteiros match the filter-based answer', () => {
  const cases = [MZ_NUMS, [0], [1], [0, 0, 0], [1, 2, 3], [0, 0, 1], [1, 0, 0], [-1, 0, 2, 0, -3]];
  let seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 60; k++) cases.push(Array.from({ length: 1 + Math.floor(rnd() * 9) }, () => rnd() < 0.4 ? 0 : Math.floor(rnd() * 21) - 10));
  for (const c of cases) {
    assert.deepStrictEqual(mzBubble(c).at(-1).result, want(c), `bolha ${c}`);
    assert.deepStrictEqual(mzPointers(c).at(-1).result, want(c), `ponteiros ${c}`);
  }
  assert.deepStrictEqual(mzBubble().at(-1).result, [1, 3, 12, 0, 0]);
});
