const test = require('node:test');
const assert = require('node:assert');
const { ISLAND_GRID, islandsDFS, islandsBFS } = require('../assets/islands.js');

// Reference: union-find over land cells.
function count(rows) {
  const R = rows.length, C = rows[0].length, p = [...Array(R * C).keys()];
  const find = (x) => p[x] === x ? x : (p[x] = find(p[x]));
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (rows[r][c] === '1') {
    if (r + 1 < R && rows[r + 1][c] === '1') p[find(r * C + c)] = find((r + 1) * C + c);
    if (c + 1 < C && rows[r][c + 1] === '1') p[find(r * C + c)] = find(r * C + c + 1);
  }
  const roots = new Set();
  for (let k = 0; k < R * C; k++) if (rows[Math.floor(k / C)][k % C] === '1') roots.add(find(k));
  return roots.size;
}

test('DFS and BFS match union-find', () => {
  const cases = [ISLAND_GRID, ['0'], ['1'], ['111', '010', '111']];
  for (let k = 0; k < 60; k++) {
    const R = 1 + k % 4, C = 1 + (k * 7) % 5;
    cases.push(Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => (k * 31 + r * 17 + c * 13) % 5 < 2 ? '1' : '0').join('')));
  }
  for (const g of cases) {
    const want = count(g);
    assert.strictEqual(islandsDFS(g).at(-1).result, want, `dfs ${g}`);
    assert.strictEqual(islandsBFS(g).at(-1).result, want, `bfs ${g}`);
  }
  assert.strictEqual(islandsDFS().at(-1).result, 3);
});
