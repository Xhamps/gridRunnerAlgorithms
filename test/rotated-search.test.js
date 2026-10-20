const test = require('node:test');
const assert = require('node:assert');
const { RS_NUMS, RS_TARGET, rsPivot, rsDirect } = require('../assets/rotated-search.js');

// Independent reference: linear scan.
const want = (a, t) => a.indexOf(t);

test('pivo and direta match a linear scan', () => {
  const cases = [[RS_NUMS, RS_TARGET], [RS_NUMS, 3], [RS_NUMS, 18], [RS_NUMS, 15], [RS_NUMS, 99],
    [[1], 1], [[1], 0], [[2, 1], 1], [[2, 1], 2], [[2, 1], 3], [[1, 2, 3], 3], [[3, 1, 2], 0], [[4, 5, 6, 7, 0, 1, 2], 0], [[4, 5, 6, 7, 0, 1, 2], 3]];
  let seed = 11;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 60; k++) {
    const n = 1 + Math.floor(rnd() * 12), set = new Set();
    while (set.size < n) set.add(Math.floor(rnd() * 41) - 20);
    const s = [...set].sort((x, y) => x - y), r = Math.floor(rnd() * n);
    const a = [...s.slice(r), ...s.slice(0, r)];
    cases.push([a, rnd() < 0.7 ? a[Math.floor(rnd() * n)] : Math.floor(rnd() * 45) - 22]);
  }
  for (const [a, t] of cases) {
    assert.strictEqual(rsPivot(a, t).at(-1).result, want(a, t), `pivo ${a} / ${t}`);
    assert.strictEqual(rsDirect(a, t).at(-1).result, want(a, t), `direta ${a} / ${t}`);
  }
  assert.strictEqual(rsPivot().at(-1).result, 4);
});
