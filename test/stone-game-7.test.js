const test = require('node:test');
const assert = require('node:assert');
const { SG7_STONES, sg7Matrix, sg7Array, sg7Memo } = require('../assets/stone-game-7.js');

// Plain minimax over the real game: Alice maximizes (Alice − Bob), Bob minimizes it. No prefix sums, no memo.
const sum = (a) => a.reduce((x, y) => x + y, 0);
const play = (a, alice = true) => {
  if (a.length <= 1) return 0;
  const opts = [a.slice(1), a.slice(0, -1)].map((rest) => (alice ? sum(rest) : -sum(rest)) + play(rest, !alice));
  return alice ? Math.max(...opts) : Math.min(...opts);
};

test('matriz, array and memo match minimax', () => {
  const cases = [SG7_STONES, [7, 90, 5, 1, 100, 10, 10, 2], [4], [3, 8], [1, 1, 1], [1000, 1, 1000]];
  for (let k = 0; k < 60; k++) cases.push(Array.from({ length: 1 + k % 9 }, (_, i) => 1 + (k * 17 + i * 31) % 25));
  for (const s of cases) {
    const want = play(s);
    assert.strictEqual(sg7Matrix(s).at(-1).result, want, `matriz ${s}`);
    assert.strictEqual(sg7Array(s).at(-1).result, want, `array ${s}`);
    assert.strictEqual(sg7Memo(s).at(-1).result, want, `memo ${s}`);
  }
  assert.strictEqual(play([5, 3, 1, 4, 2]), 6);
  assert.strictEqual(play([7, 90, 5, 1, 100, 10, 10, 2]), 122);
});

test('memo has real cache hits on the sample', () => {
  assert.ok(sg7Memo().at(-1).hits > 0);
});
