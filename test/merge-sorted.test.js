const test = require('node:test');
const assert = require('node:assert');
const { MSA_A, MSA_M, MSA_B, msFront, msBack } = require('../assets/merge-sorted.js');

// Independent reference: concatenate the valid parts and sort.
const want = (a, m, b) => [...a.slice(0, m), ...b].sort((x, y) => x - y);

test('frente and tras match concat + sort', () => {
  const cases = [[MSA_A, MSA_M, MSA_B], [[1], 1, []], [[0], 0, [1]], [[4, 5, 6, 0, 0, 0], 3, [1, 2, 3]],
    [[1, 2, 3, 0, 0, 0], 3, [4, 5, 6]], [[2, 2, 0, 0], 2, [2, 2]], [[-3, 0, 0], 1, [-5, 7]]];
  let seed = 11;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const sorted = (len) => Array.from({ length: len }, () => Math.floor(rnd() * 21) - 10).sort((x, y) => x - y);
  for (let k = 0; k < 80; k++) {
    const m = Math.floor(rnd() * 6), n = Math.floor(rnd() * 6);
    cases.push([[...sorted(m), ...Array(n).fill(0)], m, sorted(n)]);
  }
  for (const [a, m, b] of cases) {
    assert.deepStrictEqual(msFront(a, m, b).at(-1).result, want(a, m, b), `frente ${a} ${m} ${b}`);
    assert.deepStrictEqual(msBack(a, m, b).at(-1).result, want(a, m, b), `tras ${a} ${m} ${b}`);
  }
  assert.deepStrictEqual(msBack().at(-1).result, [1, 2, 4, 5, 6, 7]);
});
