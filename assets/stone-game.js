// Stone Game: the same interval DP as Predict the Winner (predict-winner.js), with piles and a strict win.
// Same line names, so the winner generators step through this listing unchanged.
if (typeof module !== 'undefined') Object.assign(globalThis, require('./predict-winner.js'));

const PILES = [3, 9, 1, 2];

const STONE_CODE = Object.fromEntries(Object.entries(WINNER_CODE).map(([tab, { text, at }]) =>
  [tab, { at, text: text.map((l) => l.replaceAll('nums', 'piles').replace('>= 0', '> 0   // spoiler: sempre true')) }]));

const STONE = { code: STONE_CODE, arr: 'piles', p1: 'Alice', p2: 'Bob', op: ['>', '≤'], wins: (d) => d > 0 };

if (typeof module !== 'undefined') module.exports = { PILES, STONE_CODE, STONE };
