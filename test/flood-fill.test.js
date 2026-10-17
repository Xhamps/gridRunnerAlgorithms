const test = require('node:test');
const assert = require('node:assert');
const { FILL_IMAGE, FILL_START, fillDFS, fillBFS } = require('../assets/flood-fill.js');

// Reference: repeat "paint any orig-colored pixel next to a painted one" until nothing changes.
function fill(image, { sr, sc, cor }) {
  const g = image.map((row) => row.slice()), orig = g[sr][sc];
  if (orig === cor) return g;
  const R = g.length, C = g[0].length, inRegion = g.map((row) => row.map(() => false));
  inRegion[sr][sc] = true;
  for (let changed = true; changed;) {
    changed = false;
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      if (inRegion[r][c] || g[r][c] !== orig) continue;
      if ([[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].some(([x, y]) => inRegion[x]?.[y])) inRegion[r][c] = changed = true;
    }
  }
  return g.map((row, r) => row.map((v, c) => inRegion[r][c] ? cor : v));
}

test('DFS and BFS match the fixed-point reference', () => {
  const cases = [[FILL_IMAGE, FILL_START], [FILL_IMAGE, { sr: 0, sc: 0, cor: 1 }], [[[0]], { sr: 0, sc: 0, cor: 2 }]];
  for (let k = 0; k < 60; k++) {
    const R = 1 + k % 4, C = 1 + (k * 7) % 5;
    const img = Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => (k * 31 + r * 17 + c * 13) % 3));
    cases.push([img, { sr: k % R, sc: (k * 3) % C, cor: k % 4 }]);
  }
  for (const [img, start] of cases) {
    const want = fill(img, start);
    assert.deepStrictEqual(fillDFS(img, start).at(-1).result, want, `dfs ${JSON.stringify([img, start])}`);
    assert.deepStrictEqual(fillBFS(img, start).at(-1).result, want, `bfs ${JSON.stringify([img, start])}`);
  }
});
