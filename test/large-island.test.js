const test = require('node:test');
const assert = require('node:assert');
const { LARGE_GRID, largeDFS, largeBFS } = require('../assets/large-island.js');

// Brute force: flip each 0 (or nothing) and measure the largest island by flood fill.
function largest(g) {
  const n = g.length, seen = g.map((row) => row.map(() => false));
  const flood = (r, c) => r < 0 || c < 0 || r >= n || c >= n || seen[r][c] || !g[r][c] ? 0
    : (seen[r][c] = true, 1 + flood(r + 1, c) + flood(r - 1, c) + flood(r, c + 1) + flood(r, c - 1));
  let best = 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) best = Math.max(best, flood(r, c));
  return best;
}
function brute(g) {
  let best = largest(g);
  g.forEach((row, r) => row.forEach((v, c) => {
    if (v === 0) { const h = g.map((x) => x.slice()); h[r][c] = 1; best = Math.max(best, largest(h)); }
  }));
  return best;
}

test('DFS and BFS match brute force', () => {
  const cases = [LARGE_GRID, [[0]], [[1]], [[1, 1], [1, 1]], [[1, 0], [0, 1]]];
  for (let k = 0; k < 80; k++) {
    const n = 1 + k % 5;
    cases.push(Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (k * 31 + r * 17 + c * 13) % 5 < 2 ? 1 : 0)));
  }
  for (const g of cases) {
    const want = brute(g);
    assert.strictEqual(largeDFS(g).at(-1).result, want, `dfs ${JSON.stringify(g)}`);
    assert.strictEqual(largeBFS(g).at(-1).result, want, `bfs ${JSON.stringify(g)}`);
  }
  assert.strictEqual(largeDFS().at(-1).result, 6);
  assert.deepStrictEqual(LARGE_GRID, [[1, 1, 0], [1, 0, 1], [0, 0, 1]], 'input not mutated');
});
