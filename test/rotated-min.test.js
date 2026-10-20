const test = require('node:test');
const assert = require('node:assert');
const { RM_NUMS, RM_WORST, rmSteps } = require('../assets/rotated-min.js');

// Independent reference: linear scan.
const want = (a) => Math.min(...a);
const rotate = (a, r) => [...a.slice(r), ...a.slice(0, r)];

test('binary search with ties matches a linear scan', () => {
  const cases = [RM_NUMS, RM_WORST, [7], [3, 3, 3], [2, 1], [1, 2], [2, 2, 2, 0, 1], [1, 1, 1, 1, 0, 1, 1, 1],
    [2, 2, 2, 0, 2, 2, 2, 2], [0, 1, 1, 1, 1], [10, 1, 10, 10, 10], [-5, -5, -3, -5]];
  let seed = 11;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 60; k++) {
    const n = 1 + Math.floor(rnd() * 12), span = 1 + Math.floor(rnd() * 5);
    const sorted = Array.from({ length: n }, () => Math.floor(rnd() * span) - 2).sort((x, y) => x - y);
    cases.push(rotate(sorted, Math.floor(rnd() * n)));
  }
  for (const c of cases) assert.strictEqual(rmSteps(c).at(-1).result, want(c), `${c}`);
});

test('samples: common case is logarithmic, worst case keeps hitting hi--', () => {
  const common = rmSteps().at(-1), worst = rmSteps(RM_WORST).at(-1);
  assert.deepStrictEqual([common.result, common.iters, common.decs], [1, 3, 1]);
  assert.deepStrictEqual([worst.result, worst.iters, worst.decs], [0, 8, 6]);
  // all-equal array: hi-- runs n - 1 times
  assert.strictEqual(rmSteps(Array(9).fill(4)).at(-1).decs, 8);
});
