const test = require('node:test');
const assert = require('node:assert');
const { AREA_GRID, areaDFS, areaBFS } = require('../assets/max-area-island.js');

// Reference: union-find with component sizes.
function maxArea(rows) {
  const R = rows.length, C = rows[0].length, p = [...Array(R * C).keys()];
  const find = (x) => p[x] === x ? x : (p[x] = find(p[x]));
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (rows[r][c] === '1') {
    if (r + 1 < R && rows[r + 1][c] === '1') p[find(r * C + c)] = find((r + 1) * C + c);
    if (c + 1 < C && rows[r][c + 1] === '1') p[find(r * C + c)] = find(r * C + c + 1);
  }
  const size = {};
  for (let k = 0; k < R * C; k++) if (rows[Math.floor(k / C)][k % C] === '1') size[find(k)] = (size[find(k)] ?? 0) + 1;
  return Math.max(0, ...Object.values(size));
}

test('DFS and BFS match union-find', () => {
  const cases = [AREA_GRID, ['0'], ['1'], ['111', '010', '111']];
  for (let k = 0; k < 60; k++) {
    const R = 1 + k % 4, C = 1 + (k * 7) % 5;
    cases.push(Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => (k * 31 + r * 17 + c * 13) % 5 < 2 ? '1' : '0').join('')));
  }
  for (const g of cases) {
    const want = maxArea(g);
    assert.strictEqual(areaDFS(g).at(-1).result, want, `dfs ${g}`);
    assert.strictEqual(areaBFS(g).at(-1).result, want, `bfs ${g}`);
  }
  assert.strictEqual(areaDFS().at(-1).result, 4);
});
