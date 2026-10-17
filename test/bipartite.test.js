const test = require('node:test');
const assert = require('node:assert');
const { BIP_GRAPH, bipDFS, bipBFS } = require('../assets/bipartite.js');

// Brute force: try every 2-coloring.
function brute(graph) {
  const n = graph.length;
  for (let m = 0; m < 1 << n; m++) if (graph.every((l, u) => l.every((v) => (m >> u & 1) !== (m >> v & 1)))) return true;
  return false;
}

test('DFS and BFS match brute force', () => {
  const cases = [BIP_GRAPH, { graph: [[]] }, { graph: [[1], [0]] }, { graph: [[1, 2], [0, 2], [0, 1]] }];
  for (let k = 0; k < 80; k++) {
    const n = 1 + k % 8, graph = Array.from({ length: n }, () => []);
    for (let e = 0; e < k % 10; e++) {
      const a = (k * 7 + e * 3) % n, b = (k * 5 + e * 11 + 1) % n;
      if (a !== b && !graph[a].includes(b)) { graph[a].push(b); graph[b].push(a); }
    }
    cases.push({ graph });
  }
  for (const g of cases) {
    const want = brute(g.graph);
    assert.strictEqual(bipDFS(g).at(-1).result, want, `dfs ${JSON.stringify(g.graph)}`);
    assert.strictEqual(bipBFS(g).at(-1).result, want, `bfs ${JSON.stringify(g.graph)}`);
  }
  assert.strictEqual(bipDFS().at(-1).result, false);
});
