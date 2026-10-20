const test = require('node:test');
const assert = require('node:assert');
const { MD_A, MD_B, mdMerge, mdCut } = require('../assets/median-two.js');

// Independent reference: concatenate, sort, read the middle.
const want = (a, b) => {
  const u = [...a, ...b].sort((x, y) => x - y), h = u.length >> 1;
  return u.length % 2 ? u[h] : (u[h - 1] + u[h]) / 2;
};

test('merge and corte match sort-based median', () => {
  const cases = [[MD_A, MD_B], [[1, 2], [3, 4]], [[], [5]], [[5], []], [[1, 3], [2]], [[1, 1, 1], [1, 1]],
    [[7, 8, 9], [1, 2]], [[-5, 0], [-3, 10, 20, 30]], [[1, 2, 3, 4, 5, 6], [0]], [[], [1, 2]]];
  let seed = 11;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const arr = (len) => Array.from({ length: len }, () => Math.floor(rnd() * 31) - 10).sort((x, y) => x - y);
  for (let k = 0; k < 60; k++) {
    const m = Math.floor(rnd() * 7), n = Math.floor(rnd() * 7) || (m ? 0 : 1);
    cases.push([arr(m), arr(n)]);
  }
  for (const [a, b] of cases) {
    assert.strictEqual(mdMerge(a, b).at(-1).result, want(a, b), `merge ${a} | ${b}`);
    assert.strictEqual(mdCut(a, b).at(-1).result, want(a, b), `corte ${a} | ${b}`);
  }
  assert.strictEqual(mdCut().at(-1).result, 6);
});

test('sample search moves left and right before landing', () => {
  const lines = mdCut().map((s) => s.msg);
  assert.ok(lines.some((m) => m.startsWith('hi =')) && lines.some((m) => m.startsWith('lo =')));
});
