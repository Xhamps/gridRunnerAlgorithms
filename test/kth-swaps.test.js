const test = require('node:test');
const assert = require('node:assert');
const { KTH_NUM, KTH_K, kthProxima, kthTrocas } = require('../assets/kth-swaps.js');

// Independent reference: list every distinct permutation, sort, take the k-th above num; BFS over adjacent swaps.
const perms = (s) => s.length <= 1 ? [s] : [...new Set([...s].flatMap((c, i) => perms(s.slice(0, i) + s.slice(i + 1)).map((p) => c + p)))];
const kth = (num, k) => perms(num).sort().filter((p) => p > num)[k - 1];
function bfs(from, to) {
  const dist = new Map([[from, 0]]), q = [from];
  for (let h = 0; h < q.length; h++) {
    const s = q[h];
    if (s === to) return dist.get(s);
    for (let i = 0; i + 1 < s.length; i++) {
      const t = s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2);
      if (!dist.has(t)) { dist.set(t, dist.get(s) + 1); q.push(t); }
    }
  }
}

test('target and swap count match brute force', () => {
  const cases = [[KTH_NUM, KTH_K], ['11112', 4], ['00123', 1], ['5489', 3]];
  for (let t = 0; t < 80; t++) {
    const n = 2 + (t % 5), num = Array.from({ length: n }, (_, i) => String((t * 7 + i * i * 3 + i) % (2 + (t % 4)))).join('');
    for (let k = 1; k <= 4; k++) if (kth(num, k)) cases.push([num, k]);
  }
  for (const [num, k] of cases) {
    const target = kth(num, k);
    assert.ok(target, `${num} k=${k} has no k-th permutation`);
    assert.strictEqual(kthProxima(num, k).at(-1).result, target, `proxima ${num} ${k}`);
    assert.strictEqual(kthTrocas(num, k).at(-1).result, bfs(num, target), `trocas ${num} ${k}`);
  }
  assert.strictEqual(kthProxima().at(-1).result, '31662');
  assert.strictEqual(kthTrocas().at(-1).result, 9);
});
