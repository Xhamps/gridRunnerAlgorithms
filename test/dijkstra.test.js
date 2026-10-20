const test = require('node:test');
const assert = require('node:assert');
const { DIJ_GRID, dijkstraArray, dijkstraHeap } = require('../assets/dijkstra.js');

// Reference: Bellman-Ford, relaxing every edge until nothing changes.
function bellmanFord(grid) {
  const R = grid.length, C = grid[0].length, d = grid.map((row) => row.map(() => Infinity));
  d[0][0] = 0;
  for (let changed = true; changed;) {
    changed = false;
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      if (!grid[r][c] || d[r][c] === Infinity) continue;
      for (const [a, b] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
        if (!grid[a]?.[b]) continue;
        const nd = d[r][c] + 1 + Math.abs(grid[r][c] - grid[a][b]);
        if (nd < d[a][b]) { d[a][b] = nd; changed = true; }
      }
    }
  }
  const t = d[R - 1][C - 1];
  return t === Infinity ? -1 : t;
}

// Cost of the returned path, recomputed step by step.
function pathCost(grid, path) {
  const C = grid[0].length, h = (k) => grid[Math.floor(k / C)][k % C];
  let sum = 0;
  for (let i = 1; i < path.length; i++) {
    const [a, b] = [path[i - 1], path[i]], dr = Math.abs(Math.floor(a / C) - Math.floor(b / C)), dc = Math.abs(a % C - b % C);
    assert.strictEqual(dr + dc, 1, 'path step is not between neighbors');
    assert.ok(h(b) !== 0, 'path goes through a wall');
    sum += 1 + Math.abs(h(a) - h(b));
  }
  return sum;
}

test('array and heap match Bellman-Ford, and the path costs the answer', () => {
  const cases = [DIJ_GRID, [[1]], [[1, 1, 1], [1, 1, 1]], [[3, 0], [0, 3]], [[1, 9, 1]], [[2], [0], [2]]];
  for (let k = 0; k < 120; k++) {
    const R = 1 + k % 4, C = 1 + (k * 5) % 5;
    const g = Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => (k * 37 + r * 19 + c * 23 + r * c * 7) % 11 % 10));
    g[0][0] ||= 1; g[R - 1][C - 1] ||= 1;
    cases.push(g);
  }
  for (const g of cases) {
    const want = bellmanFord(g);
    for (const f of [dijkstraArray, dijkstraHeap]) {
      const last = f(g).at(-1);
      assert.strictEqual(last.result, want, `${f.name} ${JSON.stringify(g)}`);
      if (want >= 0) {
        assert.deepStrictEqual([last.path[0], last.path.at(-1)], [0, g.length * g[0].length - 1]);
        assert.strictEqual(pathCost(g, last.path), want, `${f.name} path ${JSON.stringify(g)}`);
      }
    }
  }
  assert.strictEqual(dijkstraArray().at(-1).result, 7);
  assert.ok(dijkstraHeap().some((s) => /entrada velha/.test(s.msg)), 'sample must show a stale heap entry');
});
