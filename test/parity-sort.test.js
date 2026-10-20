const test = require('node:test');
const assert = require('node:assert');
const { PAR_NUMS, parHoare, parLomuto } = require('../assets/parity-sort.js');

// Independent check: same multiset as the input, and no odd number before an even one.
const sorted = (a) => a.slice().sort((x, y) => x - y);
function check(got, input, label) {
  assert.deepStrictEqual(sorted(got), sorted(input), `${label}: not a permutation of ${input}`);
  const firstOdd = got.findIndex((x) => Math.abs(x % 2) === 1);
  if (firstOdd >= 0) assert.ok(got.slice(firstOdd).every((x) => Math.abs(x % 2) === 1), `${label}: even after odd in ${got}`);
}

test('hoare and lomuto put every even before every odd', () => {
  const cases = [PAR_NUMS, [0], [1], [2, 4, 6], [1, 3, 5], [1, 2], [2, 1], [-3, -2, 0, 7, 8], [1, 1, 2, 2]];
  let seed = 11;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 60; k++) cases.push(Array.from({ length: 1 + Math.floor(rnd() * 10) }, () => Math.floor(rnd() * 41) - 20));
  for (const c of cases) {
    check(parHoare(c).at(-1).result, c, 'hoare');
    check(parLomuto(c).at(-1).result, c, 'lomuto');
  }
  assert.deepStrictEqual(parHoare().at(-1).result, [2, 6, 4, 1, 7, 3, 5]);
  assert.deepStrictEqual(parLomuto().at(-1).result, [2, 4, 6, 3, 7, 1, 5]);
});
