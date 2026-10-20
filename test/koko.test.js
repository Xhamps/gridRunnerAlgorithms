const test = require('node:test');
const assert = require('node:assert');
const { KK_PILES, KK_H, kkLinear, kkBinary } = require('../assets/koko.js');

// Independent reference: simulate hour by hour for each v, from 1 up.
const brute = (piles, h) => {
  for (let v = 1; ; v++) {
    let t = 0;
    for (let p of piles) while (p > 0) { p -= v; t++; }
    if (t <= h) return v;
  }
};

test('linear and binaria match the hour-by-hour simulation', () => {
  const cases = [[KK_PILES, KK_H], [[1], 1], [[5], 5], [[5], 1], [[30, 11, 23, 4, 20], 5], [[30, 11, 23, 4, 20], 6], [[2, 2, 2], 6]];
  let seed = 11;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 60; k++) {
    const piles = Array.from({ length: 1 + Math.floor(rnd() * 6) }, () => 1 + Math.floor(rnd() * 30));
    cases.push([piles, piles.length + Math.floor(rnd() * 20)]);
  }
  for (const [p, h] of cases) {
    const want = brute(p, h);
    assert.strictEqual(kkLinear(p, h).at(-1).result, want, `linear ${p} ${h}`);
    assert.strictEqual(kkBinary(p, h).at(-1).result, want, `binaria ${p} ${h}`);
  }
  assert.strictEqual(kkBinary().at(-1).result, 4);
});
