const test = require('node:test');
const assert = require('node:assert');
const { pascal2D, pascal1D, pascalMemo } = require('../assets/pascal-triangle.js');

// Multiplicative binomial formula, exact for these sizes.
const C = (i, j) => { let r = 1; for (let k = 1; k <= j; k++) r = r * (i - j + k) / k; return Math.round(r); };

test('matrix, array and memo match the binomial formula', () => {
  for (let n = 1; n <= 12; n++) {
    const rows = Array.from({ length: n }, (_, i) => Array.from({ length: i + 1 }, (_, j) => C(i, j)));
    assert.deepStrictEqual(pascal2D(n).at(-1).result, rows, `2D ${n}`);
    assert.deepStrictEqual(pascal1D(n).at(-1).result, rows.at(-1), `1D ${n}`);
    for (let j = 0; j < n; j++) assert.strictEqual(pascalMemo(n - 1, j).at(-1).result, C(n - 1, j), `memo C(${n - 1}, ${j})`);
  }
  assert.strictEqual(pascalMemo().at(-1).result, 6);
});
