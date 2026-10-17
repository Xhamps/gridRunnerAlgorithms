const test = require('node:test');
const assert = require('node:assert');
const { winner2D, winner1D, winnerMemo } = require('../assets/predict-winner.js');
const { PILES, STONE } = require('../assets/stone-game.js');

const diff = (a, i = 0, j = a.length - 1) => i > j ? 0 : Math.max(a[i] - diff(a, i + 1, j), a[j] - diff(a, i, j - 1));

test('stone game: DP matches minimax and Alice always wins (even count, odd sum)', () => {
  const cases = [PILES, [5, 3, 4, 5], [3, 7, 2, 3]];
  for (let k = 0; k < 40; k++) {
    const a = Array.from({ length: 2 + 2 * (k % 4) }, (_, i) => 1 + (k * 13 + i * 29) % 20);
    if (a.reduce((x, y) => x + y) % 2 === 0) a[0]++;
    cases.push(a);
  }
  for (const piles of cases) {
    assert.strictEqual(diff(piles) > 0, true, `${piles}`);
    for (const gen of [winner2D, winner1D, winnerMemo]) assert.strictEqual(gen(piles, STONE).at(-1).result, true, `${gen.name} ${piles}`);
  }
});
