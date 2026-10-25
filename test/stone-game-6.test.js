const test = require('node:test');
const assert = require('node:assert');
const { SG6_A, SG6_B, sg6Brute, sg6Greedy } = require('../assets/stone-game-6.js');

// Plain minimax without memo: try every free stone, tracking both scores.
function minimax(a, b, left = [...a.keys()], alice = 0, bob = 0, aliceTurn = true) {
  if (!left.length) return Math.sign(alice - bob) + 0;
  const res = left.map((i) => {
    const rest = left.filter((j) => j !== i);
    return aliceTurn ? minimax(a, b, rest, alice + a[i], bob, false) : minimax(a, b, rest, alice, bob + b[i], true);
  });
  return aliceTurn ? Math.max(...res) : Math.min(...res);
}

test('brute force and greedy match plain minimax', () => {
  const cases = [[SG6_A, SG6_B], [[1, 3], [2, 1]], [[1, 2], [3, 1]], [[2, 4, 3], [1, 6, 7]], [[5], [9]], [[1, 1], [1, 1]], [[3, 3, 3, 3], [3, 3, 3, 3]]];
  for (let k = 0; k < 60; k++) {
    const n = 1 + k % 6;
    cases.push([Array.from({ length: n }, (_, i) => 1 + (k * 7 + i * 13) % 10), Array.from({ length: n }, (_, i) => 1 + (k * 11 + i * 5) % 10)]);
  }
  for (const [a, b] of cases) {
    const want = minimax(a, b);
    assert.strictEqual(sg6Brute(a, b).at(-1).result, want, `forca ${a} | ${b}`);
    assert.strictEqual(sg6Greedy(a, b).at(-1).result, want, `guloso ${a} | ${b}`);
  }
  assert.strictEqual(minimax([1, 3], [2, 1]), 1);
  assert.strictEqual(minimax([1, 2], [3, 1]), 0);
  assert.strictEqual(minimax([2, 4, 3], [1, 6, 7]), -1);
});
