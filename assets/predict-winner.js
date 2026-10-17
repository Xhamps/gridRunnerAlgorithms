// Predict the Winner: generates one step per executed line, as a snapshot for the player.
// dp[i][j] = best score difference (current player − rival) on the interval nums[i..j].
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const NUMS = [1, 5, 233, 7];

const WINNER_CODE = {
  matriz: listing([
    ['alloc', 'const dp = Array.from({ length: n }, () => Array(n))'],
    ['diag', 'for (let i = 0; i < n; i++) dp[i][i] = nums[i]'],
    ['fori', 'for (let i = n - 2; i >= 0; i--)'],
    ['forj', '  for (let j = i + 1; j < n; j++)'],
    ['upd', '    dp[i][j] = max(nums[i] - dp[i+1][j], nums[j] - dp[i][j-1])'],
    ['ret', 'return dp[0][n-1] >= 0'],
  ]),
  array: listing([
    ['alloc', 'const dp = Array(n)'],
    ['fori', 'for (let i = n - 1; i >= 0; i--) {'],
    ['base', '  dp[i] = nums[i]'],
    ['forj', '  for (let j = i + 1; j < n; j++)   // para frente!'],
    ['upd', '    dp[j] = max(nums[i] - dp[j], nums[j] - dp[j-1])'],
    [null, '}'],
    ['ret', 'return dp[n-1] >= 0'],
  ]),
  memo: listing([
    ['alloc', 'const memo = Array.from({ length: n }, () => Array(n))'],
    ['fn', 'function f(i, j) {'],
    ['base', '  if (i === j) return nums[i]'],
    ['hit', '  if (memo[i][j] !== undefined) return memo[i][j]   // cache hit'],
    ['esq', '  const esq = nums[i] - f(i + 1, j)'],
    ['dir', '  const dir = nums[j] - f(i, j - 1)'],
    ['save', '  return memo[i][j] = max(esq, dir)'],
    [null, '}'],
    ['call', 'return f(0, n - 1) >= 0'],
  ]),
};

// The game rules that change between "predict the winner" and "stone game": array name, players, win test.
const WINNER = { code: WINNER_CODE, arr: 'nums', p1: 'Jogador 1', p2: 'Jogador 2', op: ['≥', '<'], wins: (d) => d >= 0 };
const verdict = (d, g) => g.wins(d) ? `${g.op[0]} 0 → ${g.p1} vence (true)` : `${g.op[1]} 0 → ${g.p2} vence (false)`;
const interval = (nums, i, j) => `[${nums.slice(i, j + 1)}]`;

// n x n matrix, row-major. Only the triangle i <= j is used.
function winner2D(nums, g = WINNER) {
  const L = g.code.matriz.at, n = nums.length, dp = new Array(n * n).fill(null), out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: dp.slice(), read: [], write: [], line, msg, ...s });

  snap(L.alloc, `malloc: n×n = ${n * n} células. Só o triângulo i ≤ j será usado.`);
  for (let i = 0; i < n; i++) dp[i * n + i] = nums[i];
  snap(L.diag, 'Caso base: com um só número (i = j), o jogador da vez pega ele. dp[i][i] = nums[i].',
    { write: [...Array(n).keys()].map((i) => i * n + i) });

  for (let i = n - 2; i >= 0; i--) {
    snap(L.fori, `i = ${i}: linha ${i}, de baixo para cima, porque dp[i] depende de dp[i+1].`, { i, vars: { i } });
    for (let j = i + 1; j < n; j++) {
      const iv = { i, j, intervalo: interval(nums, i, j) };
      snap(L.forj, `j = ${j}: intervalo ${iv.intervalo}.`, { i, j, vars: iv });
      const down = (i + 1) * n + j, left = i * n + j - 1;
      const takeL = nums[i] - dp[down], takeR = nums[j] - dp[left];
      dp[i * n + j] = Math.max(takeL, takeR);
      snap(L.upd, `Pegar ${g.arr}[${i}]=${nums[i]} deixa o rival com dp[${i + 1}][${j}]=${dp[down]} → ${takeL}. ` +
        `Pegar ${g.arr}[${j}]=${nums[j]} deixa o rival com dp[${i}][${j - 1}]=${dp[left]} → ${takeR}. Melhor: ${dp[i * n + j]}.`,
        { i, j, read: [down, left], write: [i * n + j], vars: { ...iv, 'pega esq.': takeL, 'pega dir.': takeR, 'dp[i][j]': dp[i * n + j] } });
    }
  }
  const ans = dp[n - 1];
  snap(L.ret, `dp[0][${n - 1}] = ${ans} ${verdict(ans, g)}.`, { read: [n - 1], result: g.wins(ans) });
  return out;
}

// Single array: dp[j] holds row i (when already updated) or row i+1 (not yet). gen[j] = which row.
function winner1D(nums, g = WINNER) {
  const L = g.code.array.at, n = nums.length;
  const dp = new Array(n).fill(null), gen = new Array(n).fill(null), out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: dp.slice(), gen: gen.slice(), read: [], write: [], line, msg, ...s });

  snap(L.alloc, `malloc: só n = ${n} células. Cada linha da matriz sobrescreve a anterior.`);
  for (let i = n - 1; i >= 0; i--) {
    snap(L.fori, `i = ${i}: o array passa a representar a linha ${i} da matriz.`, { i, vars: { i } });
    dp[i] = nums[i]; gen[i] = i;
    snap(L.base, `Caso base da linha: dp[${i}] = ${g.arr}[${i}] = ${nums[i]}.`, { i, j: i, write: [i], vars: { i, 'dp[i]': nums[i] } });
    for (let j = i + 1; j < n; j++) {
      const iv = { i, j, intervalo: interval(nums, i, j) };
      snap(L.forj, `j = ${j}: intervalo ${iv.intervalo}. dp[${j}] ainda é da linha ${i + 1}.`, { i, j, vars: iv });
      const old = dp[j], takeL = nums[i] - old, takeR = nums[j] - dp[j - 1];
      dp[j] = Math.max(takeL, takeR); gen[j] = i;
      snap(L.upd, `dp[${j}]=${old} ainda é da linha i=${i + 1} (= dp[${i + 1}][${j}]); dp[${j - 1}] já é da linha i=${i} (= dp[${i}][${j - 1}]). ` +
        `Por isso j vai para frente. max(${nums[i]}−${old}, ${nums[j]}−${dp[j - 1]}) = ${dp[j]}.`,
        { i, j, read: [j, j - 1], write: [j], vars: { ...iv, 'pega esq.': takeL, 'pega dir.': takeR, 'dp[j]': dp[j] } });
    }
  }
  const ans = dp[n - 1];
  snap(L.ret, `dp[${n - 1}] = ${ans} ${verdict(ans, g)}.`, { read: [n - 1], result: g.wins(ans) });
  return out;
}

// Top-down: recursion + memo n x n. A step for each line, plus one when a recursive call returns.
function winnerMemo(nums, g = WINNER) {
  const L = g.code.memo.at, n = nums.length, memo = new Array(n * n).fill(null), stack = [], out = [];
  let calls = 0, hits = 0, maxDepth = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: memo.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, hits, maxDepth, line, msg, ...s });

  const f = (i, j) => {
    const fr = { call: `f(${i}, ${j})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    const idx = i * n + j, iv = { i, j, intervalo: interval(nums, i, j) };
    snap(L.fn, `Entra em ${fr.call} sobre ${iv.intervalo}: empilha um frame (profundidade ${stack.length}).`, { i, j, vars: iv });

    if (i === j) {
      fr.note = `ret ${nums[i]}`;
      snap(L.base, `i = j: só sobrou um número, o jogador da vez pega ${nums[i]}. Retorna sem usar o memo.`, { i, j, vars: { ...iv, ret: nums[i] } });
      stack.pop(); return nums[i];
    }
    snap(L.base, `i ≠ j: mais de um número, não é caso base.`, { i, j, vars: iv });
    if (memo[idx] !== null) {
      hits++; fr.note = `hit → ${memo[idx]}`;
      snap(L.hit, `CACHE HIT: memo[${i}][${j}] = ${memo[idx]} já foi calculado. Retorna sem recursão.`, { i, j, read: [idx], vars: { ...iv, 'memo[i][j]': memo[idx] } });
      stack.pop(); return memo[idx];
    }
    snap(L.hit, `memo[${i}][${j}] vazio: precisa calcular.`, { i, j, vars: iv });

    snap(L.esq, `Pegar ${g.arr}[${i}]=${nums[i]}: chama f(${i + 1}, ${j}) para saber o que sobra para o rival.`, { i, j, vars: iv });
    const r1 = f(i + 1, j), esq = nums[i] - r1;
    fr.note = `esq=${esq}`;
    snap(L.esq, `f(${i + 1}, ${j}) voltou ${r1} → esq = ${nums[i]} − ${r1} = ${esq}.`, { i, j, vars: { ...iv, esq } });

    snap(L.dir, `Pegar ${g.arr}[${j}]=${nums[j]}: chama f(${i}, ${j - 1}).`, { i, j, vars: { ...iv, esq } });
    const r2 = f(i, j - 1), dir = nums[j] - r2;
    fr.note += ` dir=${dir}`;
    snap(L.dir, `f(${i}, ${j - 1}) voltou ${r2} → dir = ${nums[j]} − ${r2} = ${dir}.`, { i, j, vars: { ...iv, esq, dir } });

    memo[idx] = Math.max(esq, dir); fr.note += ` → ${memo[idx]}`;
    snap(L.save, `Grava memo[${i}][${j}] = max(${esq}, ${dir}) = ${memo[idx]}, retorna e desempilha.`,
      { i, j, write: [idx], vars: { ...iv, esq, dir, 'memo[i][j]': memo[idx] } });
    stack.pop(); return memo[idx];
  };

  snap(L.alloc, `malloc: memo com n×n = ${n * n} células vazias. Nada é calculado até alguém pedir.`);
  snap(L.call, `Chama f(0, ${n - 1}): o array inteiro, com ${g.p1} na vez.`);
  const ans = f(0, n - 1);
  snap(L.call, `f(0, ${n - 1}) = ${ans} ${verdict(ans, g)}. ${calls} chamadas, ${hits} cache hits.`, { read: n > 1 ? [n - 1] : [], result: g.wins(ans) });
  return out;
}

if (typeof module !== 'undefined') module.exports = { NUMS, WINNER_CODE, WINNER, winner2D, winner1D, winnerMemo };
