const test = require('node:test');
const assert = require('node:assert');
const { BITS_NUMS, bitsBubble, bitsGroups } = require('../assets/sort-by-bits.js');

// Independent reference: BFS over every permutation reachable by allowed adjacent swaps.
const pop = (x) => { let c = 0; for (; x; x &= x - 1) c++; return c; };
function reachSorted(a) {
  const goal = [...a].sort((x, y) => x - y).join(), seen = new Set([a.join()]), q = [a];
  for (let h = 0; h < q.length; h++) {
    const cur = q[h];
    if (cur.join() === goal) return true;
    for (let j = 0; j + 1 < cur.length; j++) {
      if (pop(cur[j]) !== pop(cur[j + 1])) continue;
      const nx = cur.slice(); [nx[j], nx[j + 1]] = [nx[j + 1], nx[j]];
      const key = nx.join();
      if (!seen.has(key)) { seen.add(key); q.push(nx); }
    }
  }
  return false;
}

test('bolha and grupos match BFS over reachable permutations', () => {
  const cases = [BITS_NUMS, [1], [8, 4, 2, 30, 15], [1, 2, 3, 4, 5], [3, 16, 8, 4, 2], [7, 7, 7], [2, 1]];
  let seed = 7;
  const rnd = (m) => (seed = (seed * 1103515245 + 12345) % 2147483648) % m;
  for (let k = 0; k < 80; k++) cases.push(Array.from({ length: 1 + rnd(6) }, () => 1 + rnd(32)));
  for (const c of cases) {
    const want = reachSorted(c);
    assert.strictEqual(bitsBubble(c).at(-1).result, want, `bolha ${c}`);
    assert.strictEqual(bitsGroups(c).at(-1).result, want, `grupos ${c}`);
  }
  assert.strictEqual(bitsBubble().at(-1).result, false);
});

test('sample stays within the step budget', () => {
  assert.ok(bitsBubble().length <= 220 && bitsGroups().length <= 220);
});
