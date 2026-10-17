const test = require('node:test');
const assert = require('node:assert');
const { ORANGES, orangesDFS, orangesBFS } = require('../assets/rotting-oranges.js');

// Reference: simulate minute by minute.
function simulate(grid) {
  let g = grid.map((row) => row.slice()), min = 0;
  for (;;) {
    const next = g.map((row) => row.slice());
    let changed = false;
    g.forEach((row, r) => row.forEach((v, c) => {
      if (v !== 1) return;
      if ([[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].some(([a, b]) => g[a]?.[b] === 2)) { next[r][c] = 2; changed = true; }
    }));
    if (!changed) return g.flat().includes(1) ? -1 : min;
    g = next; min++;
  }
}

test('DFS and BFS match minute-by-minute simulation', () => {
  const cases = [ORANGES, [[0]], [[1]], [[2]], [[2, 1, 1], [0, 1, 1], [1, 0, 1]], [[0, 2]]];
  for (let k = 0; k < 80; k++) {
    const R = 1 + k % 4, C = 1 + (k * 7) % 4;
    cases.push(Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => (k * 31 + r * 17 + c * 13) % 7 % 3)));
  }
  for (const g of cases) {
    const want = simulate(g);
    assert.strictEqual(orangesDFS(g).at(-1).result, want, `dfs ${JSON.stringify(g)}`);
    assert.strictEqual(orangesBFS(g).at(-1).result, want, `bfs ${JSON.stringify(g)}`);
  }
  assert.strictEqual(orangesBFS().at(-1).result, 4);
});
