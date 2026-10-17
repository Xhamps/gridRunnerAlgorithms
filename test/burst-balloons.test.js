const test = require('node:test');
const assert = require('node:assert');
const { BALLOONS, balloon2D, balloonMemo } = require('../assets/burst-balloons.js');

// Brute force: try every burst order
const brute = (a) => a.length === 0 ? 0 : Math.max(...a.map((x, i) =>
  (a[i - 1] ?? 1) * x * (a[i + 1] ?? 1) + brute([...a.slice(0, i), ...a.slice(i + 1)])));

test('2D and memo match brute force over all burst orders', () => {
  const cases = [BALLOONS, [1, 5], [7], [0, 2, 0]];
  for (let k = 0; k < 40; k++) cases.push(Array.from({ length: 1 + k % 6 }, (_, i) => (k * 7 + i * 11) % 10));
  for (const nums of cases) {
    const want = brute(nums);
    assert.strictEqual(balloon2D(nums).at(-1).result, want, `2D ${nums}`);
    assert.strictEqual(balloonMemo(nums).at(-1).result, want, `memo ${nums}`);
  }
  assert.strictEqual(balloon2D([3, 1, 5, 8]).at(-1).result, 167);
});
