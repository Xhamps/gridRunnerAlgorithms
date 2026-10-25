const test = require('node:test');
const assert = require('node:assert');
const { SG9_STONES, sg9Memo, sg9Counting } = require('../assets/stone-game-9.js');

// Plain brute force over the actual stones: the current player wins if some removal doesn't make the sum ≡ 0
// and leaves the rival losing. With no stones left, Bob wins (the player to move is Bob when n is odd).
const wins = (rest, sum, n) => {
  if (rest.length === 0) return n % 2 === 1;
  return rest.some((x, i) => (sum + x) % 3 !== 0 && !wins(rest.filter((_, j) => j !== i), sum + x, n));
};
const alice = (stones) => wins(stones, 0, stones.length);

test('memo and counting rule match brute force', () => {
  const cases = [SG9_STONES, [2, 1], [2], [5, 1, 2, 4, 3], [3], [1, 1], [3, 3, 1, 2], [1, 1, 1, 1, 2], [3, 1, 1, 1, 1, 2]];
  for (let k = 0; k < 60; k++) cases.push(Array.from({ length: 1 + k % 7 }, (_, i) => 1 + (k * 7 + i * i * 5 + i) % 9));
  for (const s of cases) {
    const want = alice(s);
    assert.strictEqual(sg9Memo(s).at(-1).result, want, `memo ${s}`);
    assert.strictEqual(sg9Counting(s).at(-1).result, want, `contagem ${s}`);
  }
  assert.strictEqual(alice([2, 1]), true);
  assert.strictEqual(alice([2]), false);
  assert.strictEqual(alice([5, 1, 2, 4, 3]), false);
});

test('counting rule holds for every residue count up to 5', () => {
  for (let c0 = 0; c0 <= 3; c0++) for (let c1 = 0; c1 <= 5; c1++) for (let c2 = 0; c2 <= 5 && c0 + c1 + c2 <= 8; c2++) {
    const s = [...Array(c0).fill(3), ...Array(c1).fill(1), ...Array(c2).fill(2)];
    if (s.length) assert.strictEqual(sg9Counting(s).at(-1).result, alice(s), `c = ${c0},${c1},${c2}`);
  }
});
