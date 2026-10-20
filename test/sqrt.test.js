const test = require('node:test');
const assert = require('node:assert');
const { SQ_X, sqLinear, sqBinary } = require('../assets/sqrt.js');

// Independent reference: Math.sqrt, nudged in case of float rounding.
const want = (x) => {
  let r = Math.floor(Math.sqrt(x));
  while (r * r > x) r--;
  while ((r + 1) * (r + 1) <= x) r++;
  return r;
};

test('linear and binaria match floor(sqrt(x))', () => {
  const cases = [SQ_X, 0, 1, 2, 3, 4, 8, 9, 15, 16, 17, 99, 100, 101];
  let seed = 11;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 60; k++) cases.push(k % 3 ? Math.floor(rnd() * 3000) : (k + 2) ** 2 - (k % 2));
  for (const x of cases) {
    assert.strictEqual(sqLinear(x).at(-1).result, want(x), `linear ${x}`);
    assert.strictEqual(sqBinary(x).at(-1).result, want(x), `binaria ${x}`);
  }
  assert.strictEqual(sqBinary().at(-1).result, 6);
});
