const test = require('node:test');
const assert = require('node:assert');
const { SEMI_NUMS, semiBubble, semiFormula } = require('../assets/semi-ordered.js');

const perms = (a) => a.length < 2 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));

// Independent reference: multi-source BFS from every goal permutation (adjacent swaps are their own inverse).
function bfsDist(n) {
  const dist = new Map(), q = [];
  for (const p of perms([...Array(n).keys()].map((k) => k + 1)))
    if (p[0] === 1 && p[n - 1] === n) { dist.set(p.join(), 0); q.push(p); }
  for (let h = 0; h < q.length; h++) {
    const p = q[h], d = dist.get(p.join());
    for (let k = 0; k + 1 < n; k++) {
      const r = p.slice(); [r[k], r[k + 1]] = [r[k + 1], r[k]];
      if (!dist.has(r.join())) { dist.set(r.join(), d + 1); q.push(r); }
    }
  }
  return dist;
}

test('bolha and formula match BFS over every permutation up to n = 6', () => {
  for (let n = 2; n <= 6; n++) {
    for (const [key, want] of bfsDist(n)) {
      const p = key.split(',').map(Number);
      assert.strictEqual(semiBubble(p).at(-1).result, want, `bolha ${key}`);
      assert.strictEqual(semiFormula(p).at(-1).result, want, `formula ${key}`);
    }
  }
  assert.strictEqual(semiFormula().at(-1).result, 7);
  assert.deepStrictEqual(SEMI_NUMS, [3, 6, 2, 5, 1, 4], 'generators must not mutate the sample');
});
