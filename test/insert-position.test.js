const test = require('node:test');
const assert = require('node:assert');
const { IP_NUMS, IP_TARGET, ipLinear, ipBinary } = require('../assets/insert-position.js');

// Independent reference: the insert position is how many numbers are smaller than the target.
const want = (a, t) => a.filter((x) => x < t).length;

test('linear and binaria match the count of smaller numbers', () => {
  const cases = [[IP_NUMS, IP_TARGET], [[1], 0], [[1], 1], [[1], 2], [[1, 3, 5, 6], 5], [[1, 3, 5, 6], 7], [[1, 3, 5, 6], 0], [[-5, -1, 4], -1]];
  let seed = 11;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 60; k++) {
    const set = new Set(Array.from({ length: 1 + Math.floor(rnd() * 10) }, () => Math.floor(rnd() * 41) - 20));
    cases.push([[...set].sort((x, y) => x - y), Math.floor(rnd() * 49) - 24]);
  }
  for (const [a, t] of cases) {
    assert.strictEqual(ipLinear(a, t).at(-1).result, want(a, t), `linear ${a} ${t}`);
    assert.strictEqual(ipBinary(a, t).at(-1).result, want(a, t), `binaria ${a} ${t}`);
  }
  assert.strictEqual(ipBinary().at(-1).result, 4);
});
