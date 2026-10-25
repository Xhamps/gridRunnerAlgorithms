const test = require('node:test');
const assert = require('node:assert');
const { SG4_N, sg4Array, sg4Memo } = require('../assets/stone-game-4.js');

// Plain minimax, no table: the player to move wins if some square leaves the rival losing.
const wins = (n) => { for (let k = 1; k * k <= n; k++) if (!wins(n - k * k)) return true; return false; };

test('array and memo match plain minimax', () => {
  const cases = [SG4_N, 0, 1, 2, 3, 4, 7, 17];
  for (let k = 0; k < 60; k++) cases.push((k * 7 + 3) % 26);
  for (const n of cases) {
    const want = wins(n);
    assert.strictEqual(sg4Array(n).at(-1).result, want, `array ${n}`);
    assert.strictEqual(sg4Memo(n).at(-1).result, want, `memo ${n}`);
  }
  assert.deepStrictEqual([1, 2, 4, 7, 17, 10].map(wins), [true, false, true, false, false, false]);
});
