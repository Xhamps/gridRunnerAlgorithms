const test = require('node:test');
const assert = require('node:assert');
const { COURSE_GRAPH, courseDFS, courseBFS } = require('../assets/course-schedule.js');

// Brute force: repeatedly take any course whose prerequisites are all taken.
function brute(n, pre) {
  const done = new Set();
  for (let changed = true; changed;) {
    changed = false;
    for (let u = 0; u < n; u++) if (!done.has(u) && pre.every(([a, b]) => a !== u || done.has(b))) { done.add(u); changed = true; }
  }
  return done.size === n;
}

test('DFS and BFS match brute force', () => {
  const cases = [COURSE_GRAPH, { n: 1, pre: [] }, { n: 2, pre: [[0, 1], [1, 0]] }, { n: 3, pre: [[1, 0], [2, 1]] }];
  for (let k = 0; k < 80; k++) {
    const n = 1 + k % 7, pre = [];
    for (let e = 0; e < k % 9; e++) {
      const a = (k * 7 + e * 3) % n, b = (k * 5 + e * 11 + 1) % n;
      if (a !== b && !pre.some(([x, y]) => x === a && y === b)) pre.push([a, b]);
    }
    cases.push({ n, pre });
  }
  for (const g of cases) {
    const want = brute(g.n, g.pre);
    assert.strictEqual(courseDFS(g).at(-1).result, want, `dfs ${JSON.stringify(g)}`);
    assert.strictEqual(courseBFS(g).at(-1).result, want, `bfs ${JSON.stringify(g)}`);
  }
  assert.strictEqual(courseDFS().at(-1).result, false);
});
