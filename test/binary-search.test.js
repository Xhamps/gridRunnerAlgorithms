const test = require('node:test');
const assert = require('node:assert');
const { BS_NUMS, BS_TARGET, bsClosed, bsHalfOpen } = require('../assets/binary-search.js');

// Independent reference: linear scan.
const want = (a, t) => a.indexOf(t);

test('fechado and semiaberto match a linear scan', () => {
  const cases = [[BS_NUMS, BS_TARGET], [[], 3], [[5], 5], [[5], 4], [[5], 6], [[1, 2], 1], [[1, 2], 2], [[1, 2], 3],
    [BS_NUMS, -5], [BS_NUMS, 24], [BS_NUMS, -9], [BS_NUMS, 30], [BS_NUMS, 4]];
  let seed = 11;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 60; k++) {
    const set = new Set(Array.from({ length: Math.floor(rnd() * 12) }, () => Math.floor(rnd() * 41) - 20));
    cases.push([[...set].sort((x, y) => x - y), Math.floor(rnd() * 45) - 22]);
  }
  for (const [a, t] of cases) {
    assert.strictEqual(bsClosed(a, t).at(-1).result, want(a, t), `fechado ${a} ${t}`);
    assert.strictEqual(bsHalfOpen(a, t).at(-1).result, want(a, t), `semiaberto ${a} ${t}`);
  }
  assert.strictEqual(bsClosed().at(-1).result, 4);
});
