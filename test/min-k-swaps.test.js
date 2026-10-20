const test = require('node:test');
const assert = require('node:assert');
const { MKS_NUM, MKS_K, mksBubble, mksFenwick } = require('../assets/min-k-swaps.js');

// Independent reference: BFS over every string reachable with at most k adjacent swaps, keep the smallest.
function brute(num, k) {
  let best = num, frontier = [num];
  const seen = new Set(frontier);
  for (let d = 0; d < k && frontier.length; d++) {
    const next = [];
    for (const s of frontier) for (let i = 0; i + 1 < s.length; i++) {
      const t = s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2);
      if (seen.has(t)) continue;
      seen.add(t); next.push(t);
      if (t < best) best = t;
    }
    frontier = next;
  }
  return best;
}

test('bolha and fenwick match BFS over adjacent swaps', () => {
  const cases = [[MKS_NUM, MKS_K], ['9', 3], ['21', 0], ['4321', 4], ['4321', 100], ['100', 1], ['0000', 2]];
  for (let s = 0; s < 80; s++) {
    const n = 1 + (s % 6), k = (s * 7) % 9;
    let num = '';
    for (let i = 0; i < n; i++) num += (s * 31 + i * 17 + i * i * s) % 10;
    cases.push([num, k]);
  }
  for (const [num, k] of cases) {
    const want = brute(num, k);
    assert.strictEqual(mksBubble(num, k).at(-1).result, want, `bolha ${num} k=${k}`);
    assert.strictEqual(mksFenwick(num, k).at(-1).result, want, `fenwick ${num} k=${k}`);
  }
  assert.strictEqual(mksBubble().at(-1).result, '001342');
});
