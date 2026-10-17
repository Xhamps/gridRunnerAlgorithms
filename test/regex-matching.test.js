const test = require('node:test');
const assert = require('node:assert');
const { S, P, regex2D, regex1D, regexMemo } = require('../assets/regex-matching.js');

// Reference: the engine's own regex, anchored (same semantics for '.' and '*')
const want = (s, p) => new RegExp(`^(?:${p})$`).test(s);

test('2D, 1D and memo match the native RegExp', () => {
  const cases = [[S, P], ['aa', 'a'], ['aa', 'a*'], ['ab', '.*'], ['mississippi', 'mis*is*p*.'], ['aab', 'c*a*b'], ['a', 'ab*'], ['ab', '.*c']];
  const chars = 'ab', pats = ['a', 'b', '.', 'a*', 'b*', '.*'];
  for (let k = 0; k < 300; k++) {
    const s = Array.from({ length: k % 5 + 1 }, (_, i) => chars[(k * 3 + i * 7) % 2]).join('');
    const p = Array.from({ length: k % 4 + 1 }, (_, i) => pats[(k * 5 + i * 11) % pats.length]).join('');
    cases.push([s, p]);
  }
  for (const [s, p] of cases) {
    const w = want(s, p);
    assert.strictEqual(regex2D(s, p).at(-1).result, w, `2D ${s} ${p}`);
    assert.strictEqual(regex1D(s, p).at(-1).result, w, `1D ${s} ${p}`);
    assert.strictEqual(regexMemo(s, p).at(-1).result, w, `memo ${s} ${p}`);
  }
});
