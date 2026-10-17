const test = require('node:test');
const assert = require('node:assert');
const { A, B, lcs2D, lcs1D, lcsMemo } = require('../assets/lcs.js');

// Brute force: longest subsequence of a (by bitmask) that is also a subsequence of b
const isSub = (s, t) => { let k = 0; for (const c of t) if (c === s[k]) k++; return k === s.length; };
const brute = (a, b) => {
  let best = 0;
  for (let mask = 0; mask < 1 << a.length; mask++) {
    const s = [...a].filter((_, k) => mask >> k & 1).join('');
    if (s.length > best && isSub(s, b)) best = s.length;
  }
  return best;
};

test('2D, 1D and memo match brute force; backtracking rebuilds a real LCS', () => {
  const cases = [[A, B], ['ABCBDAB', 'BDCAB'], ['abcde', 'ace'], ['abc', 'def'], ['', 'abc'], ['a', ''], ['aaaa', 'aa']];
  for (let k = 0; k < 200; k++) {
    const mk = (len, s) => Array.from({ length: len }, (_, i) => 'abc'[(k * s + i * 7 + (i * i) % 5) % 3]).join('');
    cases.push([mk(k % 7, 3), mk((k * 5) % 6, 11)]);
  }
  for (const [a, b] of cases) {
    const want = brute(a, b), last = lcs2D(a, b).at(-1);
    assert.strictEqual(last.result, want, `2D ${a} ${b}`);
    assert.strictEqual(last.lcs.length, want, `lcs length ${a} ${b}`);
    assert.ok(isSub(last.lcs, a) && isSub(last.lcs, b), `lcs "${last.lcs}" not common to ${a} ${b}`);
    assert.strictEqual(lcs1D(a, b).at(-1).result, want, `1D ${a} ${b}`);
    assert.strictEqual(lcsMemo(a, b).at(-1).result, want, `memo ${a} ${b}`);
  }
});
