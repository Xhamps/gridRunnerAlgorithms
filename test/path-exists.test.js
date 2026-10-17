const test = require('node:test');
const assert = require('node:assert');
const { PATH_GRAPH, pathDFS, pathBFS } = require('../assets/path-exists.js');

// Reference: union-find.
function connected(n, edges, a, b) {
  const p = [...Array(n).keys()], find = (x) => p[x] === x ? x : (p[x] = find(p[x]));
  for (const [u, v] of edges) p[find(u)] = find(v);
  return find(a) === find(b);
}

test('DFS and BFS match union-find', () => {
  const cases = [PATH_GRAPH, { ...PATH_GRAPH, destino: 5 }, { n: 1, edges: [], origem: 0, destino: 0 }];
  for (let k = 0; k < 60; k++) {
    const n = 2 + k % 7, edges = [];
    for (let e = 0; e < k % 9; e++) { const a = (k * 7 + e * 3) % n, b = (k * 5 + e * 11 + 1) % n; if (a !== b) edges.push([a, b]); }
    cases.push({ n, edges, origem: k % n, destino: (k * 3 + 1) % n });
  }
  for (const g of cases) {
    const want = connected(g.n, g.edges, g.origem, g.destino);
    assert.strictEqual(pathDFS(g).at(-1).result, want, `dfs ${JSON.stringify(g)}`);
    assert.strictEqual(pathBFS(g).at(-1).result, want, `bfs ${JSON.stringify(g)}`);
  }
});
