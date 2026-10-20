const test = require('node:test');
const assert = require('node:assert');
const { PK_NUMS, pkLinear, pkBinary } = require('../assets/peak.js');

// Independent check: brute-force list of every peak (with -∞ outside), the answer must be one of them.
const peaks = (a) => a.map((v, i) => i).filter((i) => (i === 0 || a[i] > a[i - 1]) && (i === a.length - 1 || a[i] > a[i + 1]));

test('linear and binaria return a valid peak', () => {
  const cases = [PK_NUMS, [5], [1, 2], [2, 1], [1, 2, 3], [3, 2, 1], [1, 3, 1, 3, 1], [-5, -3, -4]];
  let seed = 11;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 60; k++) {
    const a = [Math.floor(rnd() * 21) - 10];
    const n = 1 + Math.floor(rnd() * 12);
    while (a.length < n) a.push(a.at(-1) + (rnd() < 0.5 ? -1 : 1) * (1 + Math.floor(rnd() * 5)));
    cases.push(a);
  }
  for (const c of cases) {
    const ok = peaks(c);
    assert.ok(ok.includes(pkLinear(c).at(-1).result), `linear ${c}`);
    assert.ok(ok.includes(pkBinary(c).at(-1).result), `binaria ${c}`);
    assert.strictEqual(pkLinear(c).at(-1).result, ok[0], `linear finds the first peak ${c}`);
  }
  assert.strictEqual(pkLinear().at(-1).result, 1);
  assert.strictEqual(pkBinary().at(-1).result, 5);
  assert.deepStrictEqual(peaks(PK_NUMS), [1, 5]);
});
