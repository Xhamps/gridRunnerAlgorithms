const test = require('node:test');
const assert = require('node:assert');
const { HEIGHTS, pacificDFS, pacificBFS } = require('../assets/pacific-atlantic.js');

// Reference: from each cell, flow DOWNHILL (h[next] <= h[cur]) and check which borders it reaches.
function brute(h) {
  const R = h.length, C = h[0].length, res = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const seen = new Set([r * C + c]), todo = [[r, c]];
    let pac = false, atl = false;
    while (todo.length) {
      const [x, y] = todo.pop();
      if (x === 0 || y === 0) pac = true;
      if (x === R - 1 || y === C - 1) atl = true;
      for (const [a, b] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (a < 0 || b < 0 || a >= R || b >= C || h[a][b] > h[x][y] || seen.has(a * C + b)) continue;
        seen.add(a * C + b); todo.push([a, b]);
      }
    }
    if (pac && atl) res.push([r, c]);
  }
  return res;
}

test('DFS and BFS match downhill brute force', () => {
  const cases = [HEIGHTS, [[1]], [[1, 2, 2, 3, 5], [3, 2, 3, 4, 4], [2, 4, 5, 3, 1], [6, 7, 1, 4, 5], [5, 1, 1, 2, 4]]];
  for (let k = 0; k < 80; k++) {
    const R = 1 + k % 4, C = 1 + (k * 7) % 5;
    cases.push(Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => (k * 31 + r * 17 + c * 13) % 6)));
  }
  for (const h of cases) {
    const want = brute(h);
    assert.deepStrictEqual(pacificDFS(h).at(-1).result, want, `dfs ${JSON.stringify(h)}`);
    assert.deepStrictEqual(pacificBFS(h).at(-1).result, want, `bfs ${JSON.stringify(h)}`);
  }
});
