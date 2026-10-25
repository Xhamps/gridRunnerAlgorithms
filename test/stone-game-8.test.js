const test = require('node:test');
const assert = require('node:assert');
const { SG8_STONES, SG8_array, SG8_vars } = require('../assets/stone-game-8.js');

// Plain minimax on the real game: take the leftmost x > 1 stones, score their sum, put one stone with that sum back.
const play = (row) => {
  if (row.length === 1) return 0;
  let best = -Infinity;
  for (let x = 2; x <= row.length; x++) {
    const sum = row.slice(0, x).reduce((a, b) => a + b, 0);
    best = Math.max(best, sum - play([sum, ...row.slice(x)]));
  }
  return best;
};

test('array and vars match minimax on the real game', () => {
  const cases = [SG8_STONES, [7, -6, 5, 10, 5, -2, -6], [-10, -12], [3, 4], [0, 0, 0], [-1, -1, -1, -1], [5, -100, 5]];
  for (let k = 0; k < 60; k++) cases.push(Array.from({ length: 2 + k % 7 }, (_, i) => ((k * 37 + i * 53) % 41) - 20));
  for (const c of cases) {
    const want = play(c);
    assert.strictEqual(SG8_array(c).at(-1).result, want, `array ${c}`);
    assert.strictEqual(SG8_vars([...c]).at(-1).result, want, `vars ${c}`);
  }
  assert.strictEqual(play([-1, 2, -3, 4, -5]), 5);
  assert.strictEqual(play([7, -6, 5, 10, 5, -2, -6]), 13);
  assert.strictEqual(play([-10, -12]), -22);
});
