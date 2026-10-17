const test = require('node:test');
const assert = require('node:assert');
const { ROOMS, roomsDFS, roomsBFS } = require('../assets/keys-rooms.js');

// Reference: grow the set of open rooms until nothing changes.
function canVisitAll(rooms) {
  const open = new Set([0]);
  for (let grew = true; grew;) {
    grew = false;
    for (const u of [...open]) for (const k of rooms[u]) if (!open.has(k)) { open.add(k); grew = true; }
  }
  return open.size === rooms.length;
}

test('DFS and BFS match fixed-point reachability', () => {
  const cases = [ROOMS.rooms, [[1], [2], [3], []], [[]], [[1, 3], [3, 0, 1], [2], [0]]];
  for (let k = 0; k < 80; k++) {
    const n = 1 + k % 7;
    cases.push(Array.from({ length: n }, (_, u) => Array.from({ length: (k + u) % 3 }, (_, e) => (k * 7 + u * 5 + e * 3) % n)));
  }
  for (const rooms of cases) {
    const want = canVisitAll(rooms);
    assert.strictEqual(roomsDFS({ rooms }).at(-1).result, want, `dfs ${JSON.stringify(rooms)}`);
    assert.strictEqual(roomsBFS({ rooms }).at(-1).result, want, `bfs ${JSON.stringify(rooms)}`);
  }
  assert.strictEqual(roomsDFS().at(-1).result, false);
});
