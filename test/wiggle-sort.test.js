const test = require('node:test');
const assert = require('node:assert');
const { WG_NUMS, wgSorted, wgMedian } = require('../assets/wiggle-sort.js');

// Independent check: same multiset as the input and a[0] < a[1] > a[2] < ...
const wiggles = (a) => a.every((v, i) => i === 0 || (i % 2 ? a[i - 1] < v : a[i - 1] > v));
const sorted = (a) => a.slice().sort((x, y) => x - y);

test('ordena and mediana return a strict wiggle permutation', () => {
  const cases = [WG_NUMS, [1, 5, 1, 1, 6, 4], [7], [1, 2], [2, 1], [1, 3, 2], [2, 1, 1], [4, 5, 5, 6]];
  let seed = 11;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 60; k++) {
    // Build a valid wiggle (valleys from a low pool, peaks above both neighbors), then shuffle it.
    const n = 1 + Math.floor(rnd() * 9), w = [];
    for (let i = 0; i < n; i++) w.push(i % 2 ? 0 : Math.floor(rnd() * 4));
    for (let i = 1; i < n; i += 2) w[i] = Math.max(w[i - 1], w[i + 1] ?? -Infinity) + 1 + Math.floor(rnd() * 2);
    assert.ok(wiggles(w));
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [w[i], w[j]] = [w[j], w[i]]; }
    cases.push(w);
  }
  for (const c of cases) {
    for (const [name, f] of [['ordena', wgSorted], ['mediana', wgMedian]]) {
      const got = f(c).at(-1).result;
      assert.deepStrictEqual(sorted(got), sorted(c), `${name} ${c}: not a permutation`);
      assert.ok(wiggles(got), `${name} ${c}: ${got} does not wiggle`);
    }
  }
  assert.deepStrictEqual(wgMedian().at(-1).result, [3, 5, 2, 3, 1, 3]);
  assert.deepStrictEqual(wgSorted().at(-1).result, [3, 5, 2, 3, 1, 3]);
});
